// using Microsoft.AspNetCore.Authentication.JwtBearer;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Identity;
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.IdentityModel.Tokens;
// using payroll.web.Data;
// using payroll.web.Models;
// using System;
// using System.IdentityModel.Tokens.Jwt;
// using System.Security.Claims;
// using System.Text;
// using System.Threading.Tasks;
// using System.Net.Mail;
// using Microsoft.EntityFrameworkCore;
// using System.ComponentModel.DataAnnotations;

// namespace payroll.web.Controllers
// {
//     [Route("api/[controller]")]
//     [ApiController]
//     public class AuthController : ControllerBase
//     {
//         private readonly PayrollDbContext _context;
//         private readonly IConfiguration _configuration;

//         public AuthController(PayrollDbContext context, IConfiguration configuration)
//         {
//             _context = context ?? throw new ArgumentNullException(nameof(context));
//             _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
//         }

//         [HttpPost("register")]
//         public async Task<IActionResult> Register([FromBody] RegisterRequest model)
//         {
//             if (!ModelState.IsValid)
//                 return BadRequest(ModelState);

//             try
//             {
//                 if (await _context.User.AnyAsync(u => u.Email == model.Email || u.Username == model.Username))
//                     return BadRequest(new { error = "Email or username already exists." });

//                 var roleExists = await _context.Role.AnyAsync(r => r.RoleID == model.RoleId);
//                 Console.WriteLine($"[AuthController] RoleId {model.RoleId} exists: {roleExists}");
//                 if (!roleExists)
//                     return BadRequest(new { error = "Invalid role selected." });

//                 var user = new User
//                 {
//                     UserID = Guid.NewGuid(),
//                     Username = model.Username,
//                     Email = model.Email,
//                     PasswordHash = HashPassword(model.Password),
//                     CreatedAt = DateTime.UtcNow,
//                     UpdatedAt = DateTime.UtcNow,
//                     RoleID = model.RoleId
//                 };

//                 Console.WriteLine($"[AuthController] User to save: {System.Text.Json.JsonSerializer.Serialize(user)}");
//                 _context.User.Add(user);
//                 await _context.SaveChangesAsync();

//                 return Ok(new { message = "User registered successfully." });
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"[AuthController] Error during registration: {ex.Message}, StackTrace: {ex.StackTrace}");
//                 return StatusCode(500, new { error = "An error occurred during registration.", details = ex.Message });
//             }
//         }

//         [HttpPost("login")]
//         [AllowAnonymous]
//         public async Task<IActionResult> Login([FromBody] LoginRequest model)
//         {
//             if (!ModelState.IsValid)
//                 return BadRequest(ModelState);

//             try
//             {
//                 var user = await _context.User
//                     .Include(u => u.Role)
//                     .FirstOrDefaultAsync(u => u.Email == model.Email);

//                 if (user == null)
//                     return Unauthorized(new { error = "Invalid email or password." });

//                 if (!VerifyPassword(model.Password, user.PasswordHash))
//                 {
//                     Console.WriteLine($"[AuthController] Password verification failed for email: {model.Email}");
//                     return Unauthorized(new { error = "Invalid email or password." });
//                 }

//                 var claims = new[]
//                 {
//                     new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
//                     new Claim(ClaimTypes.Role, user.Role?.RoleName ?? "Employee")
//                 };

//                 var jwtKey = _configuration["Jwt:Key"];
//                 if (string.IsNullOrEmpty(jwtKey))
//                     throw new InvalidOperationException("JWT Key is not configured in appsettings.json.");

//                 var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
//                 var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

//                 var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured.");
//                 var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured.");

//                 var token = new JwtSecurityToken(
//                     issuer: issuer,
//                     audience: audience,
//                     claims: claims,
//                     expires: DateTime.Now.AddHours(1),
//                     signingCredentials: creds
//                 );

//                 var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

//                 return Ok(new
//                 {
//                     message = "Login successful.",
//                     role = user.Role?.RoleName ?? "Employee",
//                     redirectTo = user.Role?.RoleName == "Admin" ? "/Admin" : "/Employee",
//                     token = tokenString
//                 });
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"[AuthController] Error during login: {ex.Message}, StackTrace: {ex.StackTrace}");
//                 return StatusCode(500, new { error = "An error occurred during login.", details = ex.Message });
//             }
//         }

//         [HttpPost("forgot-password")]
//         [AllowAnonymous]
//         public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest model)
//         {
//             if (!ModelState.IsValid)
//                 return BadRequest(ModelState);

//             try
//             {
//                 var user = await _context.User.FirstOrDefaultAsync(u => u.Email == model.Email);
//                 if (user == null)
//                     return Ok(new { message = "If the email exists, a reset link has been sent." });

//                 var token = Guid.NewGuid().ToString();
//                 var resetToken = new PasswordResetToken
//                 {
//                     UserId = user.UserID,
//                     Token = token,
//                     ExpiryDate = DateTime.UtcNow.AddHours(1),
//                     IsUsed = false,
//                     CreatedAt = DateTime.UtcNow
//                 };

//                 _context.PasswordResetTokens.Add(resetToken);
//                 await _context.SaveChangesAsync();

//                 try
//                 {
//                     var mailAddress = new MailAddress(model.Email);
//                     Console.WriteLine($"[AuthController] Sending password reset email to {model.Email} with token {token}");
//                 }
//                 catch (FormatException)
//                 {
//                     return BadRequest(new { error = "Invalid email format." });
//                 }

//                 return Ok(new { message = "If the email exists, a reset link has been sent." });
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"[AuthController] Error during forgot password: {ex.Message}");
//                 return StatusCode(500, new { error = "An error occurred while processing your request." });
//             }
//         }

//         [HttpPost("reset-password")]
//         [AllowAnonymous]
//         public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
//         {
//             if (!ModelState.IsValid)
//                 return BadRequest(ModelState);

//             try
//             {
//                 var token = await _context.PasswordResetTokens
//                     .Include(t => t.User)
//                     .FirstOrDefaultAsync(t => t.Token == model.Token && !t.IsUsed && t.ExpiryDate > DateTime.UtcNow);

//                 if (token == null || token.User == null)
//                     return BadRequest(new { error = "Invalid or expired token." });

//                 var user = token.User;
//                 user.PasswordHash = HashPassword(model.NewPassword);
//                 user.UpdatedAt = DateTime.UtcNow;
//                 token.IsUsed = true;

//                 await _context.SaveChangesAsync();
//                 return Ok(new { message = "Password reset successfully." });
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"[AuthController] Error during reset password: {ex.Message}");
//                 return StatusCode(500, new { error = "An error occurred while resetting your password." });
//             }
//         }

//         [HttpPost("validate-token")]
//         [AllowAnonymous]
//         public async Task<IActionResult> ValidateToken([FromBody] ValidateTokenRequest model)
//         {
//             if (!ModelState.IsValid)
//                 return BadRequest(ModelState);

//             try
//             {
//                 var token = await _context.PasswordResetTokens
//                     .FirstOrDefaultAsync(t => t.Token == model.Token && !t.IsUsed && t.ExpiryDate > DateTime.UtcNow);

//                 if (token == null)
//                     return BadRequest(new { error = "Invalid or expired token." });

//                 return Ok(new { message = "Token is valid." });
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"[AuthController] Error during token validation: {ex.Message}");
//                 return StatusCode(500, new { error = "An error occurred while validating the token." });
//             }
//         }

//         [HttpGet("user-role")]
//         [Authorize]
//         public async Task<IActionResult> GetUserRole()
//         {
//             try
//             {
//                 var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//                 if (!Guid.TryParse(userIdString, out var userId))
//                 {
//                     Console.WriteLine("[AuthController] Invalid or missing UserID claim in token.");
//                     return Unauthorized(new { error = "Invalid user session." });
//                 }

//                 var user = await _context.User
//                     .Include(u => u.Role)
//                     .FirstOrDefaultAsync(u => u.UserID == userId);

//                 if (user == null)
//                 {
//                     Console.WriteLine("[AuthController] User not found for UserID: " + userId);
//                     return NotFound(new { error = "User not found." });
//                 }

//                 return Ok(new { role = user.Role?.RoleName.ToLower() ?? "employee" });
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"[AuthController] Error retrieving user role: {ex.Message}, StackTrace: {ex.StackTrace}");
//                 return StatusCode(500, new { error = "An error occurred while retrieving user role." });
//             }
//         }

//         private string HashPassword(string password)
//         {
//             if (string.IsNullOrEmpty(password)) throw new ArgumentNullException(nameof(password), "Password cannot be null or empty.");
//             var hasher = new PasswordHasher<User>();
//             return hasher.HashPassword(new User(), password); // Use new User() to satisfy nullable reference types
//         }

//         private bool VerifyPassword(string password, string hash)
//         {
//             if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hash)) return false;
//             var hasher = new PasswordHasher<User>();
//             var result = hasher.VerifyHashedPassword(new User(), hash, password);
//             if (result == PasswordVerificationResult.Failed)
//                 Console.WriteLine($"[AuthController] Password verification failed for provided hash.");
//             return result == PasswordVerificationResult.Success;
//         }
//     }

//     public class LoginRequest
//     {
//         [Required] public string Email { get; set; } = string.Empty;
//         [Required, StringLength(100, MinimumLength = 6)] public string Password { get; set; } = string.Empty;
//     }

//     public class RegisterRequest
//     {
//         [Required, StringLength(50)] public string Username { get; set; } = string.Empty;
//         [Required, EmailAddress] public string Email { get; set; } = string.Empty;
//         [Required, StringLength(100, MinimumLength = 6)] public string Password { get; set; } = string.Empty;
//         [Required] public Guid RoleId { get; set; }
//     }

//     public class ForgotPasswordRequest { [Required, EmailAddress] public string Email { get; set; } = string.Empty; }
//     public class ResetPasswordRequest
//     {
//         [Required] public string Token { get; set; } = string.Empty;
//         [Required, StringLength(100, MinimumLength = 6)] public string NewPassword { get; set; } = string.Empty;
//     }
//     public class ValidateTokenRequest { [Required] public string Token { get; set; } = string.Empty; }
// }


using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using payroll.web.Data;
using payroll.web.Models;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(PayrollDbContext context, IConfiguration configuration)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                if (await _context.User.AnyAsync(u => u.Email == model.Email || u.Username == model.Username))
                    return BadRequest(new { error = "Email or username already exists." });

                var roleExists = await _context.Role.AnyAsync(r => r.RoleID == model.RoleId);
                Console.WriteLine($"[AuthController] RoleId {model.RoleId} exists: {roleExists}");
                if (!roleExists)
                    return BadRequest(new { error = "Invalid role selected." });

                var user = new User
                {
                    UserID = Guid.NewGuid(),
                    Username = model.Username,
                    Email = model.Email,
                    PasswordHash = HashPassword(model.Password),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    RoleID = model.RoleId
                };

                Console.WriteLine($"[AuthController] User to save: {System.Text.Json.JsonSerializer.Serialize(user)}");

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    _context.User.Add(user);
                    await _context.SaveChangesAsync();

                    // If EmployeeId is provided, link User to Employee
                    if (model.EmployeeId != null)
                    {
                        var employee = await _context.Employees.FindAsync(model.EmployeeId);
                        if (employee == null)
                        {
                            await transaction.RollbackAsync();
                            return NotFound(new { error = "Employee not found." });
                        }

                        employee.UserID = user.UserID;
                        employee.UpdatedAt = DateTime.UtcNow;
                        _context.Employees.Update(employee);
                        await _context.SaveChangesAsync();
                    }

                    await transaction.CommitAsync();
                    return Ok(new { message = "User registered successfully.", userId = user.UserID });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    Console.WriteLine($"[AuthController] Error during registration transaction: {ex.Message}, StackTrace: {ex.StackTrace}");
                    return StatusCode(500, new { error = "An error occurred during registration.", details = ex.Message });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuthController] Error during registration: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { error = "An error occurred during registration.", details = ex.Message });
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var user = await _context.User
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Email == model.Email);

                if (user == null)
                    return Unauthorized(new { error = "Invalid email or password." });

                if (!VerifyPassword(model.Password, user.PasswordHash))
                {
                    Console.WriteLine($"[AuthController] Password verification failed for email: {model.Email}");
                    return Unauthorized(new { error = "Invalid email or password." });
                }

                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
                    new Claim(ClaimTypes.Role, user.Role?.RoleName ?? "Employee")
                };

                var jwtKey = _configuration["Jwt:Key"];
                if (string.IsNullOrEmpty(jwtKey))
                    throw new InvalidOperationException("JWT Key is not configured in appsettings.json.");

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured.");
                var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured.");

                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    expires: DateTime.Now.AddHours(1),
                    signingCredentials: creds
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

                return Ok(new
                {
                    message = "Login successful.",
                    role = user.Role?.RoleName ?? "Employee",
                    redirectTo = user.Role?.RoleName == "Admin" ? "/Admin" : "/Employee",
                    token = tokenString
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuthController] Error during login: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { error = "An error occurred during login.", details = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var user = await _context.User.FirstOrDefaultAsync(u => u.Email == model.Email);
                if (user == null)
                    return Ok(new { message = "If the email exists, a reset link has been sent." });

                var token = Guid.NewGuid().ToString();
                var resetToken = new PasswordResetToken
                {
                    UserId = user.UserID,
                    Token = token,
                    ExpiryDate = DateTime.UtcNow.AddHours(1),
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.PasswordResetTokens.Add(resetToken);
                await _context.SaveChangesAsync();

                try
                {
                    var mailAddress = new MailAddress(model.Email);
                    Console.WriteLine($"[AuthController] Sending password reset email to {model.Email} with token {token}");
                }
                catch (FormatException)
                {
                    return BadRequest(new { error = "Invalid email format." });
                }

                return Ok(new { message = "If the email exists, a reset link has been sent." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuthController] Error during forgot password: {ex.Message}");
                return StatusCode(500, new { error = "An error occurred while processing your request." });
            }
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var token = await _context.PasswordResetTokens
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.Token == model.Token && !t.IsUsed && t.ExpiryDate > DateTime.UtcNow);

                if (token == null || token.User == null)
                    return BadRequest(new { error = "Invalid or expired token." });

                var user = token.User;
                user.PasswordHash = HashPassword(model.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;
                token.IsUsed = true;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Password reset successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuthController] Error during reset password: {ex.Message}");
                return StatusCode(500, new { error = "An error occurred while resetting your password." });
            }
        }

        [HttpPost("validate-token")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateToken([FromBody] ValidateTokenRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var token = await _context.PasswordResetTokens
                    .FirstOrDefaultAsync(t => t.Token == model.Token && !t.IsUsed && t.ExpiryDate > DateTime.UtcNow);

                if (token == null)
                    return BadRequest(new { error = "Invalid or expired token." });

                return Ok(new { message = "Token is valid." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuthController] Error during token validation: {ex.Message}");
                return StatusCode(500, new { error = "An error occurred while validating the token." });
            }
        }

        [HttpGet("user-role")]
        [Authorize]
        public async Task<IActionResult> GetUserRole()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdString, out var userId))
                {
                    Console.WriteLine("[AuthController] Invalid or missing UserID claim in token.");
                    return Unauthorized(new { error = "Invalid user session." });
                }

                var user = await _context.User
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.UserID == userId);

                if (user == null)
                {
                    Console.WriteLine("[AuthController] User not found for UserID: " + userId);
                    return NotFound(new { error = "User not found." });
                }

                return Ok(new { role = user.Role?.RoleName.ToLower() ?? "employee" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuthController] Error retrieving user role: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { error = "An error occurred while retrieving user role." });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentEmployeeInfo()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdString, out var userId))
                {
                    Console.WriteLine("[AuthController] Invalid or missing UserID claim in token.");
                    return Unauthorized(new { error = "Invalid user session." });
                }

                var employee = await _context.Employees
                    .Include(e => e.Company)
                    .Include(e => e.Department)
                    .Include(e => e.Designation)
                    .Include(e => e.Branch)
                    .Include(e => e.Location)
                    .FirstOrDefaultAsync(e => e.UserID == userId);

                if (employee == null)
                {
                    Console.WriteLine("[AuthController] Employee not found for UserID: " + userId);
                    return NotFound(new { error = "Employee info not found." });
                }

                var response = new
                {
                    employee.EmployeeID,
                    employee.FullName,
                    employee.PhoneNumber,
                    employee.Email,
                    employee.Photo,
                    DOB = employee.DOB.ToString("yyyy-MM-dd"),
                    HireDate = employee.HireDate.ToString("yyyy-MM-dd"),
                    employee.Recruitment,
                    employee.RecruitmentType,
                    employee.RecruitmentOption,
                    employee.DepartmentType,
                    employee.EmploymentType,
                    employee.Status,
                    CompanyName = employee.Company?.CompanyName ?? "N/A",
                    DepartmentName = employee.Department?.DepartmentName ?? "N/A",
                    DesignationName = employee.Designation?.DesignationName ?? "N/A",
                    BranchName = employee.Branch?.BranchName ?? "N/A",
                    Location = $"{employee.Location?.city ?? "N/A"}, {employee.Location?.country ?? "N/A"}"
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuthController] Error retrieving employee info: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { error = "An error occurred while retrieving employee info." });
            }
        }

        private string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password)) throw new ArgumentNullException(nameof(password), "Password cannot be null or empty.");
            var hasher = new PasswordHasher<User>();
            return hasher.HashPassword(new User(), password);
        }

        private bool VerifyPassword(string password, string hash)
        {
            if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hash)) return false;
            var hasher = new PasswordHasher<User>();
            var result = hasher.VerifyHashedPassword(new User(), hash, password);
            if (result == PasswordVerificationResult.Failed)
                Console.WriteLine($"[AuthController] Password verification failed for provided hash.");
            return result == PasswordVerificationResult.Success;
        }
    }

    public class LoginRequest
    {
        [Required] public string Email { get; set; } = string.Empty;
        [Required, StringLength(100, MinimumLength = 6)] public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        [Required, StringLength(50)] public string Username { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, StringLength(100, MinimumLength = 6)] public string Password { get; set; } = string.Empty;
        [Required] public Guid RoleId { get; set; }
        public Guid? EmployeeId { get; set; }
    }

    public class ForgotPasswordRequest
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        [Required] public string Token { get; set; } = string.Empty;
        [Required, StringLength(100, MinimumLength = 6)] public string NewPassword { get; set; } = string.Empty;
    }

    public class ValidateTokenRequest
    {
        [Required] public string Token { get; set; } = string.Empty;
    }
}