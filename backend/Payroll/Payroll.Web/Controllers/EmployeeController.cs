using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly JsonSerializerOptions _jsonOptions;

        public EmployeeController(PayrollDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _jsonOptions = new JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            Console.WriteLine("[EmployeeController] Controller initialized.");
        }

        // Validate base64 string format
        private bool IsValidBase64(string? base64)
        {
            if (string.IsNullOrEmpty(base64))
                return true; // Allow null or empty for nullable Photo field

            // Check if string is valid base64 (allows padding with '=')
            return Regex.IsMatch(base64, @"^[A-Za-z0-9+/=]+$") && (base64.Length % 4 == 0);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetEmployees()
        {
            try
            {
                Console.WriteLine("[EmployeeController] Querying all employees from Employee table.");

                var result = await _context.Employees
                    .AsNoTracking()
                    .Select(e => new
                    {
                        EmployeeID = e.EmployeeID,
                        FullName = e.FullName,
                        CompanyName = e.Company != null ? e.Company.CompanyName : "N/A",
                        DepartmentName = e.Department != null ? e.Department.DepartmentName : "N/A",
                        DesignationName = e.Designation != null ? e.Designation.DesignationName : "N/A",
                        BranchName = e.Branch != null ? e.Branch.BranchName : "N/A",
                        City = e.Location != null ? e.Location.city : "N/A",
                        Country = e.Location != null ? e.Location.country : "N/A",
                        PhoneNumber = e.PhoneNumber,
                        Email = e.Email,
                        Photo = e.Photo,
                        DOB = e.DOB,
                        HireDate = e.HireDate,
                        Recruitment = e.Recruitment,
                        RecruitmentType = e.RecruitmentType,
                        RecruitmentOption = e.RecruitmentOption,
                        DepartmentType = e.DepartmentType,
                        EmploymentType = e.EmploymentType,
                        Status = e.Status,
                        CreatedAt = e.CreatedAt,
                        UpdatedAt = e.UpdatedAt,
                        WorkArrangement = e.WorkArrangement != null ? new
                        {
                            WorkArrangementId = e.WorkArrangement.WorkArrangementID,
                            ArrangementType = e.WorkArrangement.ArrangementType != null ? e.WorkArrangement.ArrangementType.Description : null,
                            PensionPlan = e.WorkArrangement.PensionPlan != null ? e.WorkArrangement.PensionPlan.Description : null,
                            PensionRate = e.WorkArrangement.PensionRate,
                            CostSharingType = e.WorkArrangement.CostSharingType != null ? e.WorkArrangement.CostSharingType.Description : null,
                            CostSharingValue = e.WorkArrangement.CostSharingValue,
                            TaxStatus = e.WorkArrangement.TaxStatus != null ? e.WorkArrangement.TaxStatus.Description : null,
                            PartialTaxRate = e.WorkArrangement.PartialTaxRate,
                            StartDate = e.WorkArrangement.StartDate,
                            EndDate = e.WorkArrangement.EndDate,
                            TerminationReason = e.WorkArrangement.TerminationReason != null ? e.WorkArrangement.TerminationReason.Description : null,
                            CreatedAt = e.WorkArrangement.CreatedAt,
                            UpdatedAt = e.WorkArrangement.UpdatedAt
                        } : null
                    })
                    .ToListAsync();

                Console.WriteLine($"[EmployeeController] Fetched {result.Count} employees successfully.");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[EmployeeController] GetEmployees failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching employees", details = errorMessage });
            }
        }

        [HttpGet("location")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> GetLocations([FromQuery] string? country, [FromQuery] string? city)
        {
            try
            {
                Console.WriteLine($"[EmployeeController] Querying locations with Country: {country}, City: {city}");
                
                var query = _context.Locations.AsQueryable();
                
                if (!string.IsNullOrWhiteSpace(country))
                {
                    query = query.Where(l => l.country.ToLower().Contains(country.ToLower()));
                }
                
                if (!string.IsNullOrWhiteSpace(city))
                {
                    query = query.Where(l => l.city.ToLower().Contains(city.ToLower()));
                }
                
                var locations = await query
                    .AsNoTracking()
                    .Select(l => new
                    {
                        location_id = l.location_id,
                        Country = l.country,
                        City = l.city,
                        StateOrRegion = l.state_or_region,
                        Street = l.street,
                        Latitude = l.latitude,
                        Longitude = l.longitude
                    })
                    .ToListAsync();

                Console.WriteLine($"[EmployeeController] Found {locations.Count} locations");
                return Ok(locations);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[EmployeeController] GetLocations failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching locations", details = errorMessage });
            }
        }

        [HttpGet("location/{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> GetLocation(Guid id)
        {
            try
            {
                Console.WriteLine($"[EmployeeController] Querying location with ID: {id}");
                
                var location = await _context.Locations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.location_id == id);

                if (location == null)
                {
                    Console.WriteLine($"[EmployeeController] Location with ID {id} not found.");
                    return NotFound(new { error = $"Location with ID {id} not found." });
                }

                var result = new
                {
                    location_id = location.location_id,
                    Country = location.country,
                    City = location.city,
                    StateOrRegion = location.state_or_region,
                    Street = location.street,
                    Latitude = location.latitude,
                    Longitude = location.longitude,
                    CreatedAt = location.created_at,
                    UpdatedAt = location.UpdatedAt
                };

                Console.WriteLine($"[EmployeeController] Found location: {JsonSerializer.Serialize(result, _jsonOptions)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[EmployeeController] GetLocation failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching location", details = errorMessage });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetEmployee(Guid id)
        {
            try
            {
                Console.WriteLine($"[EmployeeController] Querying Employee table for ID: {id}");

                var result = await _context.Employees
                    .AsNoTracking()
                    .Where(e => e.EmployeeID == id)
                    .Select(e => new
                    {
                        EmployeeID = e.EmployeeID,
                        FullName = e.FullName,
                        CompanyName = e.Company != null ? e.Company.CompanyName : "N/A",
                        DepartmentName = e.Department != null ? e.Department.DepartmentName : "N/A",
                        DesignationName = e.Designation != null ? e.Designation.DesignationName : "N/A",
                        BranchName = e.Branch != null ? e.Branch.BranchName : "N/A",
                        City = e.Location != null ? e.Location.city : "N/A",
                        Country = e.Location != null ? e.Location.country : "N/A",
                        PhoneNumber = e.PhoneNumber,
                        Email = e.Email,
                        Photo = e.Photo,
                        DOB = e.DOB,
                        HireDate = e.HireDate,
                        Recruitment = e.Recruitment,
                        RecruitmentType = e.RecruitmentType,
                        RecruitmentOption = e.RecruitmentOption,
                        DepartmentType = e.DepartmentType,
                        EmploymentType = e.EmploymentType,
                        Status = e.Status,
                        CreatedAt = e.CreatedAt,
                        UpdatedAt = e.UpdatedAt,
                        WorkArrangement = e.WorkArrangement != null ? new
                        {
                            WorkArrangementId = e.WorkArrangement.WorkArrangementID,
                            ArrangementType = e.WorkArrangement.ArrangementType != null ? e.WorkArrangement.ArrangementType.Description : null,
                            PensionPlan = e.WorkArrangement.PensionPlan != null ? e.WorkArrangement.PensionPlan.Description : null,
                            PensionRate = e.WorkArrangement.PensionRate,
                            CostSharingType = e.WorkArrangement.CostSharingType != null ? e.WorkArrangement.CostSharingType.Description : null,
                            CostSharingValue = e.WorkArrangement.CostSharingValue,
                            TaxStatus = e.WorkArrangement.TaxStatus != null ? e.WorkArrangement.TaxStatus.Description : null,
                            PartialTaxRate = e.WorkArrangement.PartialTaxRate,
                            StartDate = e.WorkArrangement.StartDate,
                            EndDate = e.WorkArrangement.EndDate,
                            TerminationReason = e.WorkArrangement.TerminationReason != null ? e.WorkArrangement.TerminationReason.Description : null,
                            CreatedAt = e.WorkArrangement.CreatedAt,
                            UpdatedAt = e.WorkArrangement.UpdatedAt
                        } : null,
                        UserID = e.UserID // Include UserID in the response
                    })
                    .FirstOrDefaultAsync();

                if (result == null)
                {
                    Console.WriteLine($"[EmployeeController] Employee with ID {id} not found.");
                    return NotFound(new { error = $"Employee with ID {id} not found." });
                }

                Console.WriteLine($"[EmployeeController] Found employee: {JsonSerializer.Serialize(result, _jsonOptions)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[EmployeeController] GetEmployee failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching employee", details = errorMessage });
            }
        }

        [HttpGet("me")]
        [Authorize(Roles = "Employee")]
        public async Task<ActionResult<object>> GetMyInfo()
        {
            try
            {
                Console.WriteLine("[EmployeeController] Querying Employee table for logged-in user.");

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    Console.WriteLine("[EmployeeController] GetMyInfo failed: UserID claim missing in JWT.");
                    return Unauthorized(new { error = "Invalid token: UserID claim missing." });
                }

                if (!Guid.TryParse(userIdClaim, out var userId))
                {
                    Console.WriteLine("[EmployeeController] GetMyInfo failed: Invalid UserID format in JWT.");
                    return Unauthorized(new { error = "Invalid token: UserID format is invalid." });
                }

                var result = await _context.Employees
                    .AsNoTracking()
                    .Where(e => e.UserID == userId)
                    .Select(e => new
                    {
                        EmployeeID = e.EmployeeID,
                        FullName = e.FullName,
                        CompanyName = e.Company != null ? e.Company.CompanyName : "N/A",
                        DepartmentName = e.Department != null ? e.Department.DepartmentName : "N/A",
                        DesignationName = e.Designation != null ? e.Designation.DesignationName : "N/A",
                        BranchName = e.Branch != null ? e.Branch.BranchName : "N/A",
                        City = e.Location != null ? e.Location.city : "N/A",
                        Country = e.Location != null ? e.Location.country : "N/A",
                        PhoneNumber = e.PhoneNumber,
                        Email = e.Email,
                        Photo = e.Photo,
                        DOB = e.DOB,
                        HireDate = e.HireDate,
                        Recruitment = e.Recruitment,
                        RecruitmentType = e.RecruitmentType,
                        RecruitmentOption = e.RecruitmentOption,
                        DepartmentType = e.DepartmentType,
                        EmploymentType = e.EmploymentType,
                        Status = e.Status,
                        CreatedAt = e.CreatedAt,
                        UpdatedAt = e.UpdatedAt,
                        WorkArrangement = e.WorkArrangement != null ? new
                        {
                            WorkArrangementId = e.WorkArrangement.WorkArrangementID,
                            ArrangementType = e.WorkArrangement.ArrangementType != null ? e.WorkArrangement.ArrangementType.Description : null,
                            PensionPlan = e.WorkArrangement.PensionPlan != null ? e.WorkArrangement.PensionPlan.Description : null,
                            PensionRate = e.WorkArrangement.PensionRate,
                            CostSharingType = e.WorkArrangement.CostSharingType != null ? e.WorkArrangement.CostSharingType.Description : null,
                            CostSharingValue = e.WorkArrangement.CostSharingValue,
                            TaxStatus = e.WorkArrangement.TaxStatus != null ? e.WorkArrangement.TaxStatus.Description : null,
                            PartialTaxRate = e.WorkArrangement.PartialTaxRate,
                            StartDate = e.WorkArrangement.StartDate,
                            EndDate = e.WorkArrangement.EndDate,
                            TerminationReason = e.WorkArrangement.TerminationReason != null ? e.WorkArrangement.TerminationReason.Description : null,
                            CreatedAt = e.WorkArrangement.CreatedAt,
                            UpdatedAt = e.WorkArrangement.UpdatedAt
                        } : null,
                        UserID = e.UserID // Include UserID in the response
                    })
                    .FirstOrDefaultAsync();

                if (result == null)
                {
                    Console.WriteLine($"[EmployeeController] GetMyInfo failed: No employee found for UserID {userId}.");
                    return NotFound(new { error = $"No employee found for the logged-in user." });
                }

                Console.WriteLine($"[EmployeeController] Found employee for UserID {userId}: {JsonSerializer.Serialize(result, _jsonOptions)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[EmployeeController] GetMyInfo failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching employee information", details = errorMessage });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> PostEmployee([FromBody] EmployeeDto employeeDto)
        {
            Console.WriteLine($"[EmployeeController] Received POST request: {JsonSerializer.Serialize(employeeDto, _jsonOptions)}");
            Console.WriteLine($"[EmployeeController] Photo field length: {employeeDto.Photo?.Length ?? 0} characters");

            if (employeeDto == null)
            {
                Console.WriteLine("[EmployeeController] PostEmployee failed: Employee data is null.");
                return BadRequest(new { error = "Employee data is null" });
            }

            // Validate Photo field as base64
            if (!IsValidBase64(employeeDto.Photo))
            {
                Console.WriteLine("[EmployeeController] PostEmployee failed: Invalid base64 string for Photo.");
                return BadRequest(new { errors = new { Photo = new[] { "The field Photo must be a valid base64 string." } } });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[] { "Unknown error" }
                );
                Console.WriteLine($"[EmployeeController] PostEmployee failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                // Get the existing location by ID
                var location = await _context.Locations.FindAsync(employeeDto.location_id);
                if (location == null)
                {
                    Console.WriteLine($"[EmployeeController] Location with ID {employeeDto.location_id} not found.");
                    return BadRequest(new { error = $"Location with ID {employeeDto.location_id} not found." });
                }

                var company = await _context.Companies.FindAsync(employeeDto.CompanyID);
                var department = await _context.Departments.FindAsync(employeeDto.DepartmentID);
                var designation = await _context.Designations.FindAsync(employeeDto.DesignationID);
                var branch = await _context.Branches.FindAsync(employeeDto.BranchID);

                if (company == null || department == null || designation == null || branch == null)
                {
                    var missing = new System.Collections.Generic.List<string>();
                    if (company == null) missing.Add($"Company with ID {employeeDto.CompanyID}");
                    if (department == null) missing.Add($"Department with ID {employeeDto.DepartmentID}");
                    if (designation == null) missing.Add($"Designation with ID {employeeDto.DesignationID}");
                    if (branch == null) missing.Add($"Branch with ID {employeeDto.BranchID}");
                    Console.WriteLine($"[EmployeeController] Missing entities: {string.Join(", ", missing)}");
                    return BadRequest(new { error = $"Missing entities: {string.Join(", ", missing)}" });
                }

                var employee = new Employee
                {
                    EmployeeID = Guid.NewGuid(),
                    CompanyID = employeeDto.CompanyID,
                    DepartmentID = employeeDto.DepartmentID,
                    DesignationID = employeeDto.DesignationID,
                    BranchID = employeeDto.BranchID,
                    location_id = employeeDto.location_id,
                    FullName = employeeDto.FullName ?? throw new ArgumentNullException(nameof(employeeDto.FullName)),
                    PhoneNumber = employeeDto.PhoneNumber,
                    Email = employeeDto.Email,
                    Photo = employeeDto.Photo,
                    DOB = employeeDto.DOB ?? DateTime.MinValue,
                    HireDate = employeeDto.HireDate ?? DateTime.MinValue,
                    Recruitment = employeeDto.Recruitment,
                    RecruitmentType = employeeDto.RecruitmentType,
                    RecruitmentOption = employeeDto.RecruitmentOption ?? "Full-Time",
                    DepartmentType = employeeDto.DepartmentType ?? "Core",
                    EmploymentType = employeeDto.EmploymentType ?? "Permanent",
                    Status = employeeDto.Status ?? "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    UserID = employeeDto.UserID // Link to existing User if provided
                };

                // Validate UserID if provided
                if (employeeDto.UserID.HasValue)
                {
                    var user = await _context.User.FindAsync(employeeDto.UserID);
                    if (user == null)
                    {
                        Console.WriteLine($"[EmployeeController] User with ID {employeeDto.UserID} not found.");
                        return BadRequest(new { error = $"User with ID {employeeDto.UserID} not found." });
                    }
                    // Ensure UserID is unique in Employees table
                    if (await _context.Employees.AnyAsync(e => e.UserID == employeeDto.UserID))
                    {
                        Console.WriteLine($"[EmployeeController] User with ID {employeeDto.UserID} is already linked to another employee.");
                        return BadRequest(new { error = $"User with ID {employeeDto.UserID} is already linked to another employee." });
                    }
                }

                Console.WriteLine($"[EmployeeController] Attempting to save employee: {JsonSerializer.Serialize(employee, _jsonOptions)}");
                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                var savedEmployee = await _context.Employees
                    .Include(e => e.Company)
                    .Include(e => e.Department)
                    .Include(e => e.Designation)
                    .Include(e => e.Branch)
                    .Include(e => e.Location)
                    .FirstOrDefaultAsync(e => e.EmployeeID == employee.EmployeeID);

                if (savedEmployee == null)
                {
                    Console.WriteLine($"[EmployeeController] Failed to reload employee with ID: {employee.EmployeeID}");
                    return StatusCode(500, new { error = "Failed to reload saved employee" });
                }

                Console.WriteLine($"[EmployeeController] Employee saved successfully with ID: {employee.EmployeeID}");
                return CreatedAtAction(nameof(GetEmployee), new { id = employee.EmployeeID }, new
                {
                    EmployeeID = savedEmployee.EmployeeID,
                    FullName = savedEmployee.FullName,
                    CompanyName = savedEmployee.Company?.CompanyName ?? "N/A",
                    DepartmentName = savedEmployee.Department?.DepartmentName ?? "N/A",
                    DesignationName = savedEmployee.Designation?.DesignationName ?? "N/A",
                    BranchName = savedEmployee.Branch?.BranchName ?? "N/A",
                    City = savedEmployee.Location?.city ?? "N/A",
                    Country = savedEmployee.Location?.country ?? "N/A",
                    PhoneNumber = savedEmployee.PhoneNumber,
                    Email = savedEmployee.Email,
                    Photo = savedEmployee.Photo,
                    DOB = savedEmployee.DOB,
                    HireDate = savedEmployee.HireDate,
                    Recruitment = savedEmployee.Recruitment,
                    RecruitmentType = savedEmployee.RecruitmentType,
                    RecruitmentOption = savedEmployee.RecruitmentOption,
                    DepartmentType = savedEmployee.DepartmentType,
                    EmploymentType = savedEmployee.EmploymentType,
                    Status = savedEmployee.Status,
                    CreatedAt = savedEmployee.CreatedAt,
                    UpdatedAt = savedEmployee.UpdatedAt,
                    UserID = savedEmployee.UserID // Include UserID in the response
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[EmployeeController] PostEmployee failed: {errorMessage}\nEmployee: {JsonSerializer.Serialize(employeeDto, _jsonOptions)}");
                return StatusCode(500, new { error = "An error occurred while creating the employee", details = errorMessage });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutEmployee(Guid id, [FromBody] EmployeeDto employeeDto)
        {
            Console.WriteLine($"[EmployeeController] Received PUT request for ID: {id}, Data: {JsonSerializer.Serialize(employeeDto, _jsonOptions)}");
            Console.WriteLine($"[EmployeeController] Photo field length: {employeeDto.Photo?.Length ?? 0} characters");

            if (employeeDto == null)
            {
                Console.WriteLine("[EmployeeController] PutEmployee failed: Employee data is null.");
                return BadRequest(new { error = "Employee data is null" });
            }

            // Validate Photo field as base64
            if (!IsValidBase64(employeeDto.Photo))
            {
                Console.WriteLine("[EmployeeController] PutEmployee failed: Invalid base64 string for Photo.");
                return BadRequest(new { errors = new { Photo = new[] { "The field Photo must be a valid base64 string." } } });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[] { "Unknown error" }
                );
                Console.WriteLine($"[EmployeeController] PutEmployee failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                Console.WriteLine($"[EmployeeController] Querying Employee table for ID: {id}");
                var employee = await _context.Employees
                    .Include(e => e.Location)
                    .FirstOrDefaultAsync(e => e.EmployeeID == id);

                if (employee == null)
                {
                    Console.WriteLine($"[EmployeeController] Employee with ID {id} not found.");
                    return NotFound(new { error = $"Employee with ID {id} not found." });
                }

                // Get the existing location by ID
                var location = await _context.Locations.FindAsync(employeeDto.location_id);
                if (location == null)
                {
                    Console.WriteLine($"[EmployeeController] Location with ID {employeeDto.location_id} not found.");
                    return BadRequest(new { error = $"Location with ID {employeeDto.location_id} not found." });
                }

                var company = await _context.Companies.FindAsync(employeeDto.CompanyID);
                var department = await _context.Departments.FindAsync(employeeDto.DepartmentID);
                var designation = await _context.Designations.FindAsync(employeeDto.DesignationID);
                var branch = await _context.Branches.FindAsync(employeeDto.BranchID);

                if (company == null || department == null || designation == null || branch == null)
                {
                    var missing = new System.Collections.Generic.List<string>();
                    if (company == null) missing.Add($"Company with ID {employeeDto.CompanyID}");
                    if (department == null) missing.Add($"Department with ID {employeeDto.DepartmentID}");
                    if (designation == null) missing.Add($"Designation with ID {employeeDto.DesignationID}");
                    if (branch == null) missing.Add($"Branch with ID {employeeDto.BranchID}");
                    Console.WriteLine($"[EmployeeController] Missing entities: {string.Join(", ", missing)}");
                    return BadRequest(new { error = $"Missing entities: {string.Join(", ", missing)}" });
                }

                employee.CompanyID = employeeDto.CompanyID;
                employee.DepartmentID = employeeDto.DepartmentID;
                employee.DesignationID = employeeDto.DesignationID;
                employee.BranchID = employeeDto.BranchID;
                employee.location_id = employeeDto.location_id;
                employee.FullName = employeeDto.FullName ?? throw new ArgumentNullException(nameof(employeeDto.FullName));
                employee.PhoneNumber = employeeDto.PhoneNumber;
                employee.Email = employeeDto.Email;
                employee.Photo = employeeDto.Photo;
                employee.DOB = employeeDto.DOB ?? DateTime.MinValue;
                employee.HireDate = employeeDto.HireDate ?? DateTime.MinValue;
                employee.Recruitment = employeeDto.Recruitment;
                employee.RecruitmentType = employeeDto.RecruitmentType;
                employee.RecruitmentOption = employeeDto.RecruitmentOption ?? "Full-Time";
                employee.DepartmentType = employeeDto.DepartmentType ?? "Core";
                employee.EmploymentType = employeeDto.EmploymentType ?? "Permanent";
                employee.Status = employeeDto.Status ?? "Active";
                employee.UpdatedAt = DateTime.UtcNow;

                // Update UserID if provided
                if (employeeDto.UserID.HasValue)
                {
                    var user = await _context.User.FindAsync(employeeDto.UserID);
                    if (user == null)
                    {
                        Console.WriteLine($"[EmployeeController] User with ID {employeeDto.UserID} not found.");
                        return BadRequest(new { error = $"User with ID {employeeDto.UserID} not found." });
                    }
                    // Ensure UserID is unique in Employees table (excluding the current employee)
                    if (await _context.Employees.AnyAsync(e => e.UserID == employeeDto.UserID && e.EmployeeID != id))
                    {
                        Console.WriteLine($"[EmployeeController] User with ID {employeeDto.UserID} is already linked to another employee.");
                        return BadRequest(new { error = $"User with ID {employeeDto.UserID} is already linked to another employee." });
                    }
                    employee.UserID = employeeDto.UserID;
                }

                Console.WriteLine($"[EmployeeController] Updating employee: {JsonSerializer.Serialize(employee, _jsonOptions)}");
                _context.Employees.Update(employee);
                await _context.SaveChangesAsync();

                var updatedEmployee = await _context.Employees
                    .Include(e => e.Company)
                    .Include(e => e.Department)
                    .Include(e => e.Designation)
                    .Include(e => e.Branch)
                    .Include(e => e.Location)
                    .FirstOrDefaultAsync(e => e.EmployeeID == id);

                if (updatedEmployee == null)
                {
                    Console.WriteLine($"[EmployeeController] Failed to reload employee with ID: {id}");
                    return StatusCode(500, new { error = "Failed to reload updated employee" });
                }

                Console.WriteLine($"[EmployeeController] Employee updated successfully with ID: {id}");
                return Ok(new
                {
                    EmployeeID = updatedEmployee.EmployeeID,
                    FullName = updatedEmployee.FullName,
                    CompanyName = updatedEmployee.Company?.CompanyName ?? "N/A",
                    DepartmentName = updatedEmployee.Department?.DepartmentName ?? "N/A",
                    DesignationName = updatedEmployee.Designation?.DesignationName ?? "N/A",
                    BranchName = updatedEmployee.Branch?.BranchName ?? "N/A",
                    City = updatedEmployee.Location?.city ?? "N/A",
                    Country = updatedEmployee.Location?.country ?? "N/A",
                    PhoneNumber = updatedEmployee.PhoneNumber,
                    Email = updatedEmployee.Email,
                    Photo = updatedEmployee.Photo,
                    DOB = updatedEmployee.DOB,
                    HireDate = updatedEmployee.HireDate,
                    Recruitment = updatedEmployee.Recruitment,
                    RecruitmentType = updatedEmployee.RecruitmentType,
                    RecruitmentOption = updatedEmployee.RecruitmentOption,
                    DepartmentType = updatedEmployee.DepartmentType,
                    EmploymentType = updatedEmployee.EmploymentType,
                    Status = updatedEmployee.Status,
                    CreatedAt = updatedEmployee.CreatedAt,
                    UpdatedAt = updatedEmployee.UpdatedAt,
                    UserID = updatedEmployee.UserID // Include UserID in the response
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[EmployeeController] PutEmployee failed: {errorMessage}\nEmployee: {JsonSerializer.Serialize(employeeDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Failed to update employee", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[EmployeeController] PutEmployee failed: {errorMessage}\nEmployee: {JsonSerializer.Serialize(employeeDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Unexpected error", details = errorMessage });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteEmployee(Guid id)
        {
            Console.WriteLine($"[EmployeeController] Received DELETE request for ID: {id}");

            try
            {
                Console.WriteLine($"[EmployeeController] Querying Employee table for ID: {id}");
                var employee = await _context.Employees
                    .Include(e => e.Location)
                    .FirstOrDefaultAsync(e => e.EmployeeID == id);

                if (employee == null)
                {
                    Console.WriteLine($"[EmployeeController] Employee with ID {id} not found.");
                    return NotFound(new { error = $"Employee with ID {id} not found." });
                }

                Console.WriteLine($"[EmployeeController] Deleting employee: {JsonSerializer.Serialize(employee, _jsonOptions)}");
                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[EmployeeController] Employee deleted successfully with ID: {id}");
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[EmployeeController] DeleteEmployee failed: {errorMessage}");
                return StatusCode(500, new { error = "Failed to delete employee", details = ex.InnerException?.Message ?? errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[EmployeeController] DeleteEmployee failed: {errorMessage}");
                return StatusCode(500, new { error = "Unexpected error", details = errorMessage });
            }
        }

        private static string GetFullErrorMessage(Exception ex)
        {
            var message = ex.Message;
            var inner = ex.InnerException;
            while (inner != null)
            {
                message += $" | Inner: {inner.Message}";
                inner = inner.InnerException;
            }
            return $"{message}\nStackTrace: {ex.StackTrace}";
        }
    }

    public class EmployeeDto
    {
        [Required]
        public Guid CompanyID { get; set; }

        [Required]
        public Guid DepartmentID { get; set; }

        [Required]
        public Guid DesignationID { get; set; }

        [Required]
        public Guid BranchID { get; set; }

        [Required]
        public Guid location_id { get; set; }

        [Required]
        [StringLength(255, MinimumLength = 2)]
        public string FullName { get; set; } = null!;

        [StringLength(20)]
        [Phone]
        public string? PhoneNumber { get; set; }

        [StringLength(255)]
        [EmailAddress]
        public string? Email { get; set; }

        public string? Photo { get; set; } // No length limit, aligns with nvarchar(max)

        [DataType(DataType.Date)]
        public DateTime? DOB { get; set; }

        [DataType(DataType.Date)]
        public DateTime? HireDate { get; set; }

        [StringLength(50)]
        public string? Recruitment { get; set; }

        [StringLength(100)]
        public string? RecruitmentType { get; set; }

        [StringLength(50)]
        public string? RecruitmentOption { get; set; }

        [StringLength(50)]
        public string? DepartmentType { get; set; }

        [StringLength(50)]
        public string? EmploymentType { get; set; }

        [StringLength(50)]
        public string? Status { get; set; }

        public Guid? UserID { get; set; } // Optional UserID to link to an existing User
    }

    public class GuidConverter : System.Text.Json.Serialization.JsonConverter<Guid>
    {
        public override Guid Read(ref Utf8JsonReader reader, Type typeToConvert, System.Text.Json.JsonSerializerOptions options)
        {
            var value = reader.GetString();
            return string.IsNullOrEmpty(value) || value == "00000000-0000-0000-0000-000000000000"
                ? Guid.Empty
                : Guid.Parse(value);
        }

        public override void Write(Utf8JsonWriter writer, Guid value, System.Text.Json.JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString());
        }
    }
}