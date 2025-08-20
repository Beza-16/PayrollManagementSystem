using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly JsonSerializerOptions _jsonOptions;

        public DepartmentController(PayrollDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _jsonOptions = new JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles };
            Console.WriteLine("[DepartmentController] Controller initialized.");
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDepartments()
        {
            try
            {
                Console.WriteLine("[DepartmentController] Querying all departments from Departments table.");
                var departments = await _context.Departments
                    .Include(d => d.Company)
                    .Include(d => d.Branch)
                    .ToListAsync();

                var result = departments.Select(d => new
                {
                    d.DepartmentID,
                    d.DepartmentName,
                    d.Status,
                    CompanyName = d.Company?.CompanyName ?? "N/A",
                    BranchName = d.Branch?.BranchName ?? "N/A",
                    d.CreatedAt,
                    d.UpdatedAt
                }).ToList();

                Console.WriteLine($"[DepartmentController] Fetched {result.Count} departments successfully.");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DepartmentController] GetDepartments failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching departments", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetDepartment(Guid id)
        {
            try
            {
                Console.WriteLine($"[DepartmentController] Querying Departments table for ID: {id}");
                var department = await _context.Departments
                    .Include(d => d.Company)
                    .Include(d => d.Branch)
                    .FirstOrDefaultAsync(d => d.DepartmentID == id);

                if (department == null)
                {
                    Console.WriteLine($"[DepartmentController] Department with ID {id} not found.");
                    return NotFound(new { error = $"Department with ID {id} not found." });
                }

                var result = new
                {
                    department.DepartmentID,
                    department.DepartmentName,
                    department.Status,
                    CompanyName = department.Company?.CompanyName ?? "N/A",
                    BranchName = department.Branch?.BranchName ?? "N/A",
                    department.CreatedAt,
                    department.UpdatedAt
                };

                Console.WriteLine($"[DepartmentController] Found department: {JsonSerializer.Serialize(result, _jsonOptions)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DepartmentController] GetDepartment failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching department", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult<Department>> PostDepartment([FromBody] DepartmentDto departmentDto)
        {
            Console.WriteLine($"[DepartmentController] Received POST request: {JsonSerializer.Serialize(departmentDto, _jsonOptions)}");

            if (departmentDto == null)
            {
                Console.WriteLine("[DepartmentController] PostDepartment failed: Department data is null.");
                return BadRequest(new { error = "Department data is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[] { "Unknown error" }
                );
                Console.WriteLine($"[DepartmentController] PostDepartment failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                Console.WriteLine($"[DepartmentController] Querying Companies table for CompanyID: {departmentDto.CompanyID}");
                var company = await _context.Companies.FindAsync(departmentDto.CompanyID);
                if (company == null)
                {
                    Console.WriteLine($"[DepartmentController] Company with ID {departmentDto.CompanyID} not found.");
                    ModelState.AddModelError("CompanyID", $"Company with ID '{departmentDto.CompanyID}' does not exist.");
                    return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                }

                // Handle nullable BranchID
                Guid? branchId = departmentDto.BranchID;
                if (branchId.HasValue)
                {
                    Console.WriteLine($"[DepartmentController] Querying Branches table for BranchID: {branchId}");
                    var branch = await _context.Branches.FindAsync(branchId.Value);
                    if (branch == null)
                    {
                        Console.WriteLine($"[DepartmentController] Branch with ID {branchId} not found.");
                        ModelState.AddModelError("BranchID", $"Branch with ID '{branchId}' does not exist.");
                        return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                    }
                    if (branch.CompanyID != departmentDto.CompanyID)
                    {
                        Console.WriteLine($"[DepartmentController] Branch {branchId} does not belong to Company {departmentDto.CompanyID}.");
                        ModelState.AddModelError("BranchID", $"Branch with ID '{branchId}' does not belong to Company with ID '{departmentDto.CompanyID}'.");
                        return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                    }
                }

                var department = new Department
                {
                    DepartmentID = Guid.NewGuid(),
                    CompanyID = departmentDto.CompanyID,
                    BranchID = branchId,
                    DepartmentName = departmentDto.DepartmentName ?? string.Empty,
                    Status = departmentDto.Status,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                Console.WriteLine($"[DepartmentController] Attempting to save department: {JsonSerializer.Serialize(department, _jsonOptions)}");
                _context.Departments.Add(department);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[DepartmentController] Department saved successfully with ID: {department.DepartmentID}");
                var branchName = department.Branch?.BranchName ?? "N/A";
                return CreatedAtAction(nameof(GetDepartment), new { id = department.DepartmentID }, new
                {
                    department.DepartmentID,
                    department.DepartmentName,
                    department.Status,
                    CompanyName = company.CompanyName,
                    BranchName = branchName,
                    department.CreatedAt,
                    department.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DepartmentController] PostDepartment failed: {errorMessage}\nDepartment: {JsonSerializer.Serialize(departmentDto, _jsonOptions)}");
                return StatusCode(500, new { error = "An error occurred while creating the department", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DepartmentController] PostDepartment failed: {errorMessage}\nDepartment: {JsonSerializer.Serialize(departmentDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Unexpected error", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDepartment(Guid id, [FromBody] DepartmentDto departmentDto)
        {
            Console.WriteLine($"[DepartmentController] Received PUT request for ID: {id}, Data: {JsonSerializer.Serialize(departmentDto, _jsonOptions)}");

            if (departmentDto == null)
            {
                Console.WriteLine("[DepartmentController] PutDepartment failed: Department data is null.");
                return BadRequest(new { error = "Department data is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[] { "Unknown error" }
                );
                Console.WriteLine($"[DepartmentController] PutDepartment failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                Console.WriteLine($"[DepartmentController] Querying Departments table for ID: {id}");
                var department = await _context.Departments
                    .Include(d => d.Company)
                    .Include(d => d.Branch)
                    .FirstOrDefaultAsync(d => d.DepartmentID == id);

                if (department == null)
                {
                    Console.WriteLine($"[DepartmentController] Department with ID {id} not found.");
                    return NotFound(new { error = $"Department with ID {id} not found." });
                }

                Console.WriteLine($"[DepartmentController] Querying Companies table for CompanyID: {departmentDto.CompanyID}");
                var company = await _context.Companies.FindAsync(departmentDto.CompanyID);
                if (company == null)
                {
                    Console.WriteLine($"[DepartmentController] Company with ID {departmentDto.CompanyID} not found.");
                    ModelState.AddModelError("CompanyID", $"Company with ID '{departmentDto.CompanyID}' does not exist.");
                    return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                }

                Guid? branchId = departmentDto.BranchID;
                if (branchId.HasValue)
                {
                    Console.WriteLine($"[DepartmentController] Querying Branches table for BranchID: {branchId}");
                    var branch = await _context.Branches.FindAsync(branchId.Value);
                    if (branch == null)
                    {
                        Console.WriteLine($"[DepartmentController] Branch with ID {branchId} not found.");
                        ModelState.AddModelError("BranchID", $"Branch with ID '{branchId}' does not exist.");
                        return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                    }
                    if (branch.CompanyID != departmentDto.CompanyID)
                    {
                        Console.WriteLine($"[DepartmentController] Branch {branchId} does not belong to Company {departmentDto.CompanyID}.");
                        ModelState.AddModelError("BranchID", $"Branch with ID '{branchId}' does not belong to Company with ID '{departmentDto.CompanyID}'.");
                        return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                    }
                }

                department.CompanyID = departmentDto.CompanyID;
                department.BranchID = branchId;
                department.DepartmentName = departmentDto.DepartmentName ?? string.Empty;
                department.Status = departmentDto.Status;
                department.UpdatedAt = DateTime.UtcNow;

                Console.WriteLine($"[DepartmentController] Updating department: {JsonSerializer.Serialize(department, _jsonOptions)}");
                _context.Entry(department).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                Console.WriteLine($"[DepartmentController] Department updated successfully with ID: {id}");
                var branchName = department.Branch?.BranchName ?? "N/A";
                return Ok(new
                {
                    department.DepartmentID,
                    department.DepartmentName,
                    department.Status,
                    CompanyName = company.CompanyName,
                    BranchName = branchName,
                    department.CreatedAt,
                    department.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DepartmentController] PutDepartment failed: {errorMessage}\nDepartment: {JsonSerializer.Serialize(departmentDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Failed to update department", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DepartmentController] PutDepartment failed: {errorMessage}\nDepartment: {JsonSerializer.Serialize(departmentDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Unexpected error", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(Guid id)
        {
            Console.WriteLine($"[DepartmentController] Received DELETE request for ID: {id}");

            try
            {
                Console.WriteLine($"[DepartmentController] Querying Departments table for ID: {id}");
                var department = await _context.Departments
                    .FirstOrDefaultAsync(d => d.DepartmentID == id);

                if (department == null)
                {
                    Console.WriteLine($"[DepartmentController] Department with ID {id} not found.");
                    return NotFound(new { error = $"Department with ID {id} not found." });
                }

                Console.WriteLine($"[DepartmentController] Deleting department: {JsonSerializer.Serialize(department, _jsonOptions)}");
                _context.Departments.Remove(department);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[DepartmentController] Department deleted successfully with ID: {id}");
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DepartmentController] DeleteDepartment failed: {errorMessage}");
                return StatusCode(500, new { error = "Failed to delete department", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DepartmentController] DeleteDepartment failed: {errorMessage}");
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

    public class DepartmentDto
    {
        [Required]
        public Guid CompanyID { get; set; }
        public Guid? BranchID { get; set; }
        [Required]
        [MaxLength(50)]
        public string? DepartmentName { get; set; }
        [Required]
        [Range(0, 1, ErrorMessage = "Status must be 0 or 1.")]
        public int Status { get; set; }
    }
}