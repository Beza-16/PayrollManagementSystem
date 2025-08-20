using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace payroll.web.Controllers
{
    /// <summary>
    /// API controller for managing leave types.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class LeaveTypeController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly ILogger<LeaveTypeController> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        /// <summary>
        /// Initializes a new instance of the <see cref="LeaveTypeController"/> class.
        /// </summary>
        /// <param name="context">The database context.</param>
        /// <param name="logger">The logger instance.</param>
        public LeaveTypeController(PayrollDbContext context, ILogger<LeaveTypeController> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _jsonOptions = new JsonSerializerOptions
            {
                ReferenceHandler = ReferenceHandler.IgnoreCycles,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
            _logger.LogInformation("LeaveTypeController initialized at {Time}", DateTime.UtcNow.AddHours(3)); // EAT time
        }

        /// <summary>
        /// Retrieves all leave types.
        /// </summary>
        /// <returns>A list of leave types.</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetLeaveTypes()
        {
            try
            {
                _logger.LogInformation("Querying all leave types from LeaveType table.");
                var leaveTypes = await _context.LeaveTypes
                    .AsNoTracking()
                    .Select(lt => new
                    {
                        lt.LeaveTypeID,
                        lt.Name,
                        lt.Description,
                        lt.LeaveWithPay,
                        lt.MedicalApproval,
                        lt.HRApprovalRequired,
                        lt.CreatedAt,
                        lt.UpdatedAt
                    })
                    .ToListAsync();

                _logger.LogInformation("Fetched {Count} leave types successfully.", leaveTypes.Count);
                return Ok(leaveTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leave types.");
                return StatusCode(500, new { error = "Error fetching leave types", details = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves a leave type by ID.
        /// </summary>
        /// <param name="id">The ID of the leave type.</param>
        /// <returns>The leave type if found; otherwise, a 404 response.</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetLeaveType(Guid id)
        {
            if (id == Guid.Empty)
            {
                _logger.LogWarning("Invalid LeaveType ID: {Id}", id);
                return BadRequest(new { error = "Invalid LeaveType ID" });
            }

            try
            {
                _logger.LogInformation("Querying LeaveType table for ID: {Id}", id);
                var leaveType = await _context.LeaveTypes
                    .AsNoTracking()
                    .Select(lt => new
                    {
                        lt.LeaveTypeID,
                        lt.Name,
                        lt.Description,
                        lt.LeaveWithPay,
                        lt.MedicalApproval,
                        lt.HRApprovalRequired,
                        lt.CreatedAt,
                        lt.UpdatedAt
                    })
                    .FirstOrDefaultAsync(lt => lt.LeaveTypeID == id);

                if (leaveType == null)
                {
                    _logger.LogWarning("LeaveType with ID {Id} not found.", id);
                    return NotFound(new { error = $"LeaveType with ID {id} not found." });
                }

                _logger.LogInformation("Found leave type with ID: {Id}", id);
                return Ok(leaveType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching leave type with ID: {Id}", id);
                return StatusCode(500, new { error = "Error fetching leave type", details = ex.Message });
            }
        }

        /// <summary>
        /// Creates a new leave type.
        /// </summary>
        /// <param name="leaveTypeDto">The leave type data.</param>
        /// <returns>The created leave type with a 201 response.</returns>
        [HttpPost]
        public async Task<ActionResult<object>> PostLeaveType([FromBody] LeaveTypePostDto leaveTypeDto)
        {
            if (leaveTypeDto == null || string.IsNullOrWhiteSpace(leaveTypeDto.Name))
            {
                _logger.LogWarning("Invalid POST request: LeaveType data is null or name is empty.");
                return BadRequest(new { error = "LeaveType name is required and cannot be empty." });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new[] { "Unknown error" }
                );
                _logger.LogWarning("Invalid model state for POST request: {Errors}", JsonSerializer.Serialize(errors, _jsonOptions));
                return BadRequest(new { errors });
            }

            try
            {
                var leaveType = new LeaveType
                {
                    LeaveTypeID = Guid.NewGuid(),
                    Name = leaveTypeDto.Name.Trim(),
                    Description = leaveTypeDto.Description?.Trim(),
                    LeaveWithPay = leaveTypeDto.LeaveWithPay ?? false,
                    MedicalApproval = leaveTypeDto.MedicalApproval ?? false,
                    HRApprovalRequired = leaveTypeDto.HRApprovalRequired ?? false,
                    CreatedAt = DateTime.UtcNow.AddHours(3), // EAT time
                    UpdatedAt = DateTime.UtcNow.AddHours(3) // EAT time
                };

                _logger.LogInformation("Attempting to save leave type: {LeaveType}", JsonSerializer.Serialize(leaveType, _jsonOptions));
                _context.LeaveTypes.Add(leaveType);
                await _context.SaveChangesAsync();

                var result = new
                {
                    leaveType.LeaveTypeID,
                    leaveType.Name,
                    leaveType.Description,
                    leaveType.LeaveWithPay,
                    leaveType.MedicalApproval,
                    leaveType.HRApprovalRequired,
                    leaveType.CreatedAt,
                    leaveType.UpdatedAt
                };

                _logger.LogInformation("Leave type saved successfully with ID: {Id}", leaveType.LeaveTypeID);
                return CreatedAtAction(nameof(GetLeaveType), new { id = leaveType.LeaveTypeID }, result);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Invalid JSON data in POST request.");
                return BadRequest(new { error = "Invalid JSON data", details = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error creating leave type: {LeaveType}", JsonSerializer.Serialize(leaveTypeDto, _jsonOptions));
                return StatusCode(500, new { error = "Error creating leave type", details = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating leave type: {LeaveType}", JsonSerializer.Serialize(leaveTypeDto, _jsonOptions));
                return StatusCode(500, new { error = "Unexpected error", details = ex.Message });
            }
        }

        /// <summary>
        /// Updates an existing leave type.
        /// </summary>
        /// <param name="id">The ID of the leave type to update.</param>
        /// <param name="leaveTypeDto">The updated leave type data.</param>
        /// <returns>The updated leave type with a 200 response.</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLeaveType(Guid id, [FromBody] LeaveTypePutDto leaveTypeDto)
        {
            if (id == Guid.Empty || leaveTypeDto == null || id != leaveTypeDto.LeaveTypeID || string.IsNullOrWhiteSpace(leaveTypeDto.Name))
            {
                _logger.LogWarning("Invalid PUT request: Invalid ID {Id} or LeaveType data is null/empty.", id);
                return BadRequest(new { error = "Invalid LeaveType ID or data." });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new[] { "Unknown error" }
                );
                _logger.LogWarning("Invalid model state for PUT request: {Errors}", JsonSerializer.Serialize(errors, _jsonOptions));
                return BadRequest(new { errors });
            }

            try
            {
                _logger.LogInformation("Querying LeaveType table for ID: {Id}", id);
                var leaveType = await _context.LeaveTypes.FirstOrDefaultAsync(lt => lt.LeaveTypeID == id);

                if (leaveType == null)
                {
                    _logger.LogWarning("LeaveType with ID {Id} not found.", id);
                    return NotFound(new { error = $"LeaveType with ID {id} not found." });
                }

                leaveType.Name = leaveTypeDto.Name.Trim();
                leaveType.Description = leaveTypeDto.Description?.Trim();
                leaveType.LeaveWithPay = leaveTypeDto.LeaveWithPay ?? false;
                leaveType.MedicalApproval = leaveTypeDto.MedicalApproval ?? false;
                leaveType.HRApprovalRequired = leaveTypeDto.HRApprovalRequired ?? false;
                leaveType.UpdatedAt = DateTime.UtcNow.AddHours(3); // EAT time

                _logger.LogInformation("Updating leave type: {LeaveType}", JsonSerializer.Serialize(leaveType, _jsonOptions));
                _context.Entry(leaveType).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Leave type updated successfully with ID: {Id}", id);
                return Ok(new
                {
                    leaveType.LeaveTypeID,
                    leaveType.Name,
                    leaveType.Description,
                    leaveType.LeaveWithPay,
                    leaveType.MedicalApproval,
                    leaveType.HRApprovalRequired,
                    leaveType.CreatedAt,
                    leaveType.UpdatedAt
                });
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Invalid JSON data in PUT request.");
                return BadRequest(new { error = "Invalid JSON data", details = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error updating leave type with ID: {Id}", id);
                return StatusCode(500, new { error = "Error updating leave type", details = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating leave type with ID: {Id}", id);
                return StatusCode(500, new { error = "Unexpected error", details = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a leave type by ID.
        /// </summary>
        /// <param name="id">The ID of the leave type to delete.</param>
        /// <returns>A 204 response if successful; otherwise, a 404 or 500 response.</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLeaveType(Guid id)
        {
            if (id == Guid.Empty)
            {
                _logger.LogWarning("Invalid DELETE request: Invalid ID {Id}", id);
                return BadRequest(new { error = "Invalid LeaveType ID" });
            }

            try
            {
                _logger.LogInformation("Querying LeaveType table for ID: {Id}", id);
                var leaveType = await _context.LeaveTypes.FirstOrDefaultAsync(lt => lt.LeaveTypeID == id);

                if (leaveType == null)
                {
                    _logger.LogWarning("LeaveType with ID {Id} not found.", id);
                    return NotFound(new { error = $"LeaveType with ID {id} not found." });
                }

                var hasRequests = await _context.Leaves.AnyAsync(l => l.LeaveTypeID == id);
                if (hasRequests)
                {
                    _logger.LogWarning("Cannot delete LeaveType with ID {Id} due to linked leave requests.", id);
                    return BadRequest(new { error = $"Cannot delete LeaveType with ID {id} because it is linked to existing leave requests." });
                }

                _logger.LogInformation("Deleting leave type with ID: {Id}", id);
                _context.LeaveTypes.Remove(leaveType);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Leave type deleted successfully with ID: {Id}", id);
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error deleting leave type with ID: {Id}", id);
                return StatusCode(500, new { error = "Error deleting leave type", details = ex.InnerException?.Message ?? ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error deleting leave type with ID: {Id}", id);
                return StatusCode(500, new { error = "Unexpected error", details = ex.Message });
            }
        }
    }

    /// <summary>
    /// DTO for creating a leave type.
    /// </summary>
    public class LeaveTypePostDto
    {
        [Required(ErrorMessage = "Name is required.")]
        [MaxLength(50, ErrorMessage = "Name cannot exceed 50 characters.")]
        public string Name { get; set; } = null!;

        [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
        public string? Description { get; set; }

        public bool? LeaveWithPay { get; set; }

        public bool? MedicalApproval { get; set; }

        public bool? HRApprovalRequired { get; set; }
    }

    /// <summary>
    /// DTO for updating a leave type.
    /// </summary>
    public class LeaveTypePutDto
    {
        [Required(ErrorMessage = "LeaveTypeID is required.")]
        public Guid LeaveTypeID { get; set; }

        [Required(ErrorMessage = "Name is required.")]
        [MaxLength(50, ErrorMessage = "Name cannot exceed 50 characters.")]
        public string Name { get; set; } = null!;

        [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
        public string? Description { get; set; }

        public bool? LeaveWithPay { get; set; }

        public bool? MedicalApproval { get; set; }

        public bool? HRApprovalRequired { get; set; }
    }
}