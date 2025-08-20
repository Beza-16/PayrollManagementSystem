using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PeriodController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly JsonSerializerOptions _jsonOptions;

        public PeriodController(PayrollDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _jsonOptions = new JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles };
            Console.WriteLine("[PeriodController] Controller initialized.");
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetPeriods()
        {
            try
            {
                Console.WriteLine("[PeriodController] Querying all periods from Periods table.");
                var periods = await _context.Periods
                    .ToListAsync();

                var result = periods.Select(p => new
                {
                    PeriodId = p.PeriodID,
                    Name = p.PeriodName,
                    Sequence = p.PeriodSequence,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    CalendarType = p.CalendarType,
                    CutoffDay = p.CutoffDay,
                    Status = p.Status, // Return as int
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                }).ToList();

                Console.WriteLine($"[PeriodController] Fetched {result.Count} periods successfully.");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[PeriodController] GetPeriods failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching periods", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetPeriod(Guid id)
        {
            try
            {
                Console.WriteLine($"[PeriodController] Querying Periods table for ID: {id}");
                var period = await _context.Periods
                    .FirstOrDefaultAsync(p => p.PeriodID == id);

                if (period == null)
                {
                    Console.WriteLine($"[PeriodController] Period with ID {id} not found.");
                    return NotFound(new { error = $"Period with ID {id} not found." });
                }

                var result = new
                {
                    PeriodId = period.PeriodID,
                    Name = period.PeriodName,
                    Sequence = period.PeriodSequence,
                    StartDate = period.StartDate,
                    EndDate = period.EndDate,
                    CalendarType = period.CalendarType,
                    CutoffDay = period.CutoffDay,
                    Status = period.Status, // Return as int
                    CreatedAt = period.CreatedAt,
                    UpdatedAt = period.UpdatedAt
                };

                Console.WriteLine($"[PeriodController] Found period: {JsonSerializer.Serialize(result, _jsonOptions)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[PeriodController] GetPeriod failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching period", details = errorMessage });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Period>> PostPeriod(PeriodDto periodDto)
        {
            Console.WriteLine($"[PeriodController] Received POST request: {JsonSerializer.Serialize(periodDto, _jsonOptions)}");

            if (periodDto == null)
            {
                Console.WriteLine("[PeriodController] PostPeriod failed: Period data is null.");
                return BadRequest(new { error = "Period data is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[] { "Unknown error" }
                );
                Console.WriteLine($"[PeriodController] PostPeriod failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                if (!new[] { "Gregorian", "Ethiopian" }.Contains(periodDto.CalendarType))
                {
                    Console.WriteLine($"[PeriodController] Invalid CalendarType: {periodDto.CalendarType}");
                    return BadRequest(new { error = "CalendarType must be 'Gregorian' or 'Ethiopian'" });
                }

                if (periodDto.Status == null || periodDto.Status < 0 || periodDto.Status > 2)
                {
                    Console.WriteLine($"[PeriodController] Invalid Status: {periodDto.Status}");
                    return BadRequest(new { error = "Status must be 0 (Open), 1 (Processing), or 2 (Closed)" });
                }

                var period = new Period
                {
                    PeriodID = Guid.NewGuid(),
                    PeriodName = periodDto.Name ?? string.Empty,
                    PeriodSequence = periodDto.Sequence,
                    StartDate = periodDto.StartDate,
                    EndDate = periodDto.EndDate,
                    CalendarType = periodDto.CalendarType,
                    CutoffDay = periodDto.CutoffDay,
                    Status = periodDto.Status.Value, // Use int value
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                Console.WriteLine($"[PeriodController] Attempting to save period: {JsonSerializer.Serialize(period, _jsonOptions)}");
                _context.Periods.Add(period);
                await _context.SaveChangesAsync();

                var savedPeriod = await _context.Periods
                    .FirstOrDefaultAsync(p => p.PeriodID == period.PeriodID);

                if (savedPeriod == null)
                {
                    Console.WriteLine($"[PeriodController] Failed to reload period with ID: {period.PeriodID}");
                    return StatusCode(500, new { error = "Failed to reload saved period" });
                }

                Console.WriteLine($"[PeriodController] Period saved successfully with ID: {period.PeriodID}");
                return CreatedAtAction(nameof(GetPeriod), new { id = period.PeriodID }, new
                {
                    PeriodId = savedPeriod.PeriodID,
                    Name = savedPeriod.PeriodName,
                    Sequence = savedPeriod.PeriodSequence,
                    StartDate = savedPeriod.StartDate,
                    EndDate = savedPeriod.EndDate,
                    CalendarType = savedPeriod.CalendarType,
                    CutoffDay = savedPeriod.CutoffDay,
                    Status = savedPeriod.Status, // Return as int
                    CreatedAt = savedPeriod.CreatedAt,
                    UpdatedAt = savedPeriod.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[PeriodController] PostPeriod failed: {errorMessage}\nPeriod: {JsonSerializer.Serialize(periodDto, _jsonOptions)}");
                return StatusCode(500, new { error = "An error occurred while creating the period", details = errorMessage });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutPeriod(Guid id, [FromBody] PeriodDto periodDto)
        {
            Console.WriteLine($"[PeriodController] Received PUT request for ID: {id}, Data: {JsonSerializer.Serialize(periodDto, _jsonOptions)}");

            if (periodDto == null)
            {
                Console.WriteLine("[PeriodController] PutPeriod failed: Period data is null.");
                return BadRequest(new { error = "Period data is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[] { "Unknown error" }
                );
                Console.WriteLine($"[PeriodController] PutPeriod failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                Console.WriteLine($"[PeriodController] Querying Periods table for ID: {id}");
                var period = await _context.Periods
                    .FirstOrDefaultAsync(p => p.PeriodID == id);

                if (period == null)
                {
                    Console.WriteLine($"[PeriodController] Period with ID {id} not found.");
                    return NotFound(new { error = $"Period with ID {id} not found." });
                }

                if (!new[] { "Gregorian", "Ethiopian" }.Contains(periodDto.CalendarType))
                {
                    Console.WriteLine($"[PeriodController] Invalid CalendarType: {periodDto.CalendarType}");
                    return BadRequest(new { error = "CalendarType must be 'Gregorian' or 'Ethiopian'" });
                }

                if (periodDto.Status == null || periodDto.Status < 0 || periodDto.Status > 2)
                {
                    Console.WriteLine($"[PeriodController] Invalid Status: {periodDto.Status}");
                    return BadRequest(new { error = "Status must be 0 (Open), 1 (Processing), or 2 (Closed)" });
                }

                period.PeriodName = periodDto.Name ?? string.Empty;
                period.PeriodSequence = periodDto.Sequence;
                period.StartDate = periodDto.StartDate;
                period.EndDate = periodDto.EndDate;
                period.CalendarType = periodDto.CalendarType;
                period.CutoffDay = periodDto.CutoffDay;
                period.Status = periodDto.Status.Value; // Use int value
                period.UpdatedAt = DateTime.UtcNow;

                Console.WriteLine($"[PeriodController] Updating period: {JsonSerializer.Serialize(period, _jsonOptions)}");
                _context.Periods.Update(period);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[PeriodController] Period updated successfully with ID: {id}");
                return Ok(new
                {
                    PeriodId = period.PeriodID,
                    Name = period.PeriodName,
                    Sequence = period.PeriodSequence,
                    StartDate = period.StartDate,
                    EndDate = period.EndDate,
                    CalendarType = period.CalendarType,
                    CutoffDay = period.CutoffDay,
                    Status = period.Status, // Return as int
                    CreatedAt = period.CreatedAt,
                    UpdatedAt = period.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[PeriodController] PutPeriod failed: {errorMessage}\nPeriod: {JsonSerializer.Serialize(periodDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Failed to update period", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[PeriodController] PutPeriod failed: {errorMessage}\nPeriod: {JsonSerializer.Serialize(periodDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Unexpected error", details = errorMessage });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePeriod(Guid id)
        {
            Console.WriteLine($"[PeriodController] Received DELETE request for ID: {id}");

            try
            {
                Console.WriteLine($"[PeriodController] Querying Periods table for ID: {id}");
                var period = await _context.Periods
                    .FirstOrDefaultAsync(p => p.PeriodID == id);

                if (period == null)
                {
                    Console.WriteLine($"[PeriodController] Period with ID {id} not found.");
                    return NotFound(new { error = $"Period with ID {id} not found." });
                }

                Console.WriteLine($"[PeriodController] Deleting period: {JsonSerializer.Serialize(period, _jsonOptions)}");
                _context.Periods.Remove(period);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[PeriodController] Period deleted successfully with ID: {id}");
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[PeriodController] DeletePeriod failed: {errorMessage}");
                return StatusCode(500, new { error = "Failed to delete period", details = ex.InnerException?.Message ?? errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[PeriodController] DeletePeriod failed: {errorMessage}");
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

    public class PeriodDto
    {
        [Required]
        [MaxLength(50)]
        public string? Name { get; set; }
        public int? Sequence { get; set; }
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
        [Required]
        [MaxLength(20)]
        public string CalendarType { get; set; } = "Gregorian";
        [Required]
        public int CutoffDay { get; set; }
        [Required]
        public int? Status { get; set; } // Changed to int? to match backend
    }
}