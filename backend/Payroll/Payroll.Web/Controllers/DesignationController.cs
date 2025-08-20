using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DesignationController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly JsonSerializerOptions _jsonOptions;

        public DesignationController(PayrollDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _jsonOptions = new JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles };
            Console.WriteLine("[DesignationController] Controller initialized.");
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDesignations()
        {
            try
            {
                Console.WriteLine("[DesignationController] Querying all designations from Designations table.");
                var designations = await _context.Designations
                    .Include(d => d.DepartmentNavigation)
                    .ToListAsync();

                var result = designations.Select(d => new
                {
                    d.DesignationID,
                    d.DesignationName,
                    d.Status,
                    DepartmentName = d.DepartmentNavigation?.DepartmentName ?? "N/A",
                    d.CreatedAt,
                    d.UpdatedAt
                }).ToList();

                Console.WriteLine($"[DesignationController] Fetched {result.Count} designations successfully.");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DesignationController] GetDesignations failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching designations", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetDesignation(Guid id)
        {
            try
            {
                Console.WriteLine($"[DesignationController] Querying Designations table for ID: {id}");
                var designation = await _context.Designations
                    .Include(d => d.DepartmentNavigation)
                    .FirstOrDefaultAsync(d => d.DesignationID == id);

                if (designation == null)
                {
                    Console.WriteLine($"[DesignationController] Designation with ID {id} not found.");
                    return NotFound(new { error = $"Designation with ID {id} not found." });
                }

                var result = new
                {
                    designation.DesignationID,
                    designation.DesignationName,
                    designation.Status,
                    DepartmentName = designation.DepartmentNavigation?.DepartmentName ?? "N/A",
                    designation.CreatedAt,
                    designation.UpdatedAt
                };

                Console.WriteLine($"[DesignationController] Found designation: {JsonSerializer.Serialize(result, _jsonOptions)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DesignationController] GetDesignation failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching designation", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult<Designation>> PostDesignation([FromBody] DesignationDto designationDto)
        {
            Console.WriteLine($"[DesignationController] Received POST request: {JsonSerializer.Serialize(designationDto, _jsonOptions)}");

            if (designationDto == null)
            {
                Console.WriteLine("[DesignationController] PostDesignation failed: Designation data is null.");
                return BadRequest(new { error = "Designation data is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[] { "Unknown error" }
                );
                Console.WriteLine($"[DesignationController] PostDesignation failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                Console.WriteLine($"[DesignationController] Querying Departments table for DepartmentID: {designationDto.DepartmentID}");
                var department = await _context.Departments.FindAsync(designationDto.DepartmentID);
                if (department == null)
                {
                    Console.WriteLine($"[DesignationController] Department with ID {designationDto.DepartmentID} not found.");
                    ModelState.AddModelError("DepartmentID", $"Department with ID '{designationDto.DepartmentID}' does not exist.");
                    return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                }

                var designation = new Designation
                {
                    DesignationID = Guid.NewGuid(),
                    DepartmentID = designationDto.DepartmentID,
                    DesignationName = designationDto.DesignationName ?? string.Empty,
                    Status = designationDto.Status
                };

                Console.WriteLine($"[DesignationController] Attempting to save designation: {JsonSerializer.Serialize(designation, _jsonOptions)}");
                _context.Designations.Add(designation);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[DesignationController] Designation saved successfully with ID: {designation.DesignationID}");
                return CreatedAtAction(nameof(GetDesignation), new { id = designation.DesignationID }, new
                {
                    designation.DesignationID,
                    designation.DesignationName,
                    designation.Status,
                    DepartmentName = department.DepartmentName,
                    designation.CreatedAt,
                    designation.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DesignationController] PostDesignation failed: {errorMessage}\nDesignation: {JsonSerializer.Serialize(designationDto, _jsonOptions)}");
                return StatusCode(500, new { error = "An error occurred while creating the designation", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DesignationController] PostDesignation failed: {errorMessage}\nDesignation: {JsonSerializer.Serialize(designationDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Unexpected error", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDesignation(Guid id, [FromBody] DesignationDto designationDto)
        {
            Console.WriteLine($"[DesignationController] Received PUT request for ID: {id}, Data: {JsonSerializer.Serialize(designationDto, _jsonOptions)}");

            if (designationDto == null)
            {
                Console.WriteLine("[DesignationController] PutDesignation failed: Designation data is null.");
                return BadRequest(new { error = "Designation data is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[] { "Unknown error" }
                );
                Console.WriteLine($"[DesignationController] PutDesignation failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                Console.WriteLine($"[DesignationController] Querying Designations table for ID: {id}");
                var designation = await _context.Designations
                    .Include(d => d.DepartmentNavigation)
                    .FirstOrDefaultAsync(d => d.DesignationID == id);

                if (designation == null)
                {
                    Console.WriteLine($"[DesignationController] Designation with ID {id} not found.");
                    return NotFound(new { error = $"Designation with ID {id} not found." });
                }

                Console.WriteLine($"[DesignationController] Querying Departments table for DepartmentID: {designationDto.DepartmentID}");
                var department = await _context.Departments.FindAsync(designationDto.DepartmentID);
                if (department == null)
                {
                    Console.WriteLine($"[DesignationController] Department with ID {designationDto.DepartmentID} not found.");
                    ModelState.AddModelError("DepartmentID", $"Department with ID '{designationDto.DepartmentID}' does not exist.");
                    return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                }

                designation.DepartmentID = designationDto.DepartmentID;
                designation.DesignationName = designationDto.DesignationName ?? string.Empty;
                designation.Status = designationDto.Status;
                designation.UpdatedAt = DateTime.UtcNow;

                Console.WriteLine($"[DesignationController] Updating designation: {JsonSerializer.Serialize(designation, _jsonOptions)}");
                _context.Entry(designation).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                Console.WriteLine($"[DesignationController] Designation updated successfully with ID: {id}");
                return Ok(new
                {
                    designation.DesignationID,
                    designation.DesignationName,
                    designation.Status,
                    DepartmentName = department.DepartmentName,
                    designation.CreatedAt,
                    designation.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DesignationController] PutDesignation failed: {errorMessage}\nDesignation: {JsonSerializer.Serialize(designationDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Failed to update designation", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DesignationController] PutDesignation failed: {errorMessage}\nDesignation: {JsonSerializer.Serialize(designationDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Unexpected error", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDesignation(Guid id)
        {
            Console.WriteLine($"[DesignationController] Received DELETE request for ID: {id}");

            try
            {
                Console.WriteLine($"[DesignationController] Querying Designations table for ID: {id}");
                var designation = await _context.Designations
                    .FirstOrDefaultAsync(d => d.DesignationID == id);

                if (designation == null)
                {
                    Console.WriteLine($"[DesignationController] Designation with ID {id} not found.");
                    return NotFound(new { error = $"Designation with ID {id} not found." });
                }

                Console.WriteLine($"[DesignationController] Deleting designation: {JsonSerializer.Serialize(designation, _jsonOptions)}");
                _context.Designations.Remove(designation);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[DesignationController] Designation deleted successfully with ID: {id}");
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DesignationController] DeleteDesignation failed: {errorMessage}");
                return StatusCode(500, new { error = "Failed to delete designation", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[DesignationController] DeleteDesignation failed: {errorMessage}");
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

    public class DesignationDto
    {
        [Required]
        public Guid DepartmentID { get; set; }

        [Required]
        [MaxLength(50)]
        public string? DesignationName { get; set; }

        [Required]
        [Range(0, 1, ErrorMessage = "Status must be 0 or 1.")]
        public int Status { get; set; }
    }
}