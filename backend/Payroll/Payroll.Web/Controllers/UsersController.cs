using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly PayrollDbContext _context;

        public UsersController(PayrollDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                if (await _context.User.AnyAsync(u => u.Email == model.Email || u.Username == model.Username))
                    return BadRequest(new { error = "Email or username already exists." });

                var roleExists = await _context.Role.AnyAsync(r => r.RoleID == model.RoleId);
                if (!roleExists)
                    return BadRequest(new { error = "Invalid role selected." });

                var defaultPassword = GenerateDefaultPassword();
                var user = new User
                {
                    UserID = Guid.NewGuid(),
                    Username = model.Username,
                    Email = model.Email,
                    PasswordHash = HashPassword(defaultPassword),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    RoleID = model.RoleId
                };

                _context.User.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "User created successfully.", userId = user.UserID, defaultPassword = defaultPassword });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UsersController] Error during user creation: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { error = "An error occurred while creating the user.", details = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _context.User
                    .Include(u => u.Role)
                    .Select(u => new
                    {
                        u.UserID,
                        u.Username,
                        u.Email,
                        RoleName = u.Role != null ? u.Role.RoleName : "Unknown",
                        u.CreatedAt,
                        u.UpdatedAt
                    })
                    .ToListAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UsersController] Error retrieving users: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { error = "An error occurred while retrieving users.", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var user = await _context.User.FindAsync(id);
                if (user == null)
                    return NotFound(new { error = "User not found." });

                if (await _context.User.AnyAsync(u => u.UserID != id && (u.Email == model.Email || u.Username == model.Username)))
                    return BadRequest(new { error = "Email or username already exists." });

                var roleExists = await _context.Role.AnyAsync(r => r.RoleID == model.RoleId);
                if (!roleExists)
                    return BadRequest(new { error = "Invalid role selected." });

                user.Username = model.Username;
                user.Email = model.Email;
                user.RoleID = model.RoleId;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = "User updated successfully.", userId = user.UserID });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UsersController] Error during user update: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { error = "An error occurred while updating the user.", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            try
            {
                var user = await _context.User.FindAsync(id);
                if (user == null)
                    return NotFound(new { error = "User not found." });

                _context.User.Remove(user);
                await _context.SaveChangesAsync();
                return Ok(new { message = "User deleted successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UsersController] Error during user deletion: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { error = "An error occurred while deleting the user.", details = ex.Message });
            }
        }

        private string GenerateDefaultPassword(int length = 12)
        {
            const string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string lowercase = "abcdefghijklmnopqrstuvwxyz";
            const string digits = "0123456789";
            const string special = "!@#$%^&*";

            var random = new Random();
            var password = new char[length];

            // Ensure at least one character from each set
            password[0] = uppercase[random.Next(uppercase.Length)];
            password[1] = lowercase[random.Next(lowercase.Length)];
            password[2] = digits[random.Next(digits.Length)];
            password[3] = special[random.Next(special.Length)];

            // Fill the remaining length with random characters from all sets
            const string allChars = uppercase + lowercase + digits + special;
            for (int i = 4; i < length; i++)
            {
                password[i] = allChars[random.Next(allChars.Length)];
            }

            // Shuffle the password array
            password = password.OrderBy(x => random.Next()).ToArray();

            return new string(password);
        }

        private string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password)) throw new ArgumentNullException(nameof(password), "Password cannot be null or empty.");
            var hasher = new PasswordHasher<User>();
            return hasher.HashPassword(new User(), password);
        }
    }

    public class CreateUserRequest
    {
        [Required, StringLength(50)] public string Username { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required] public Guid RoleId { get; set; }
    }

    public class UpdateUserRequest
    {
        [Required, StringLength(50)] public string Username { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required] public Guid RoleId { get; set; }
    }
}