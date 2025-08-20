using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Models;
using payroll.web.Data;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly PayrollDbContext _context;

        public AttendanceController(PayrollDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpPost]
        public async Task<IActionResult> PostAttendance([FromBody] AttendanceRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(request.InTime) || string.IsNullOrEmpty(request.Date))
            {
                return BadRequest("InTime and Date are required.");
            }

            if (!TimeSpan.TryParse(request.InTime, out var inTime))
            {
                return BadRequest("Invalid InTime format. Use HH:mm:ss.");
            }

            TimeSpan? outTime = null;
            TimeSpan parsedOutTime = TimeSpan.Zero; // Initialize to fix CS0165
            if (!string.IsNullOrEmpty(request.OutTime) && !TimeSpan.TryParse(request.OutTime, out parsedOutTime))
            {
                return BadRequest("Invalid OutTime format. Use HH:mm:ss.");
            }
            else if (!string.IsNullOrEmpty(request.OutTime))
            {
                outTime = parsedOutTime;
            }

            if (!DateTime.TryParse(request.Date, out var date))
            {
                return BadRequest("Invalid Date format. Use yyyy-MM-dd.");
            }

            // Validate EmployeeID and PeriodID existence
            if (!await _context.Employees.AnyAsync(e => e.EmployeeID == request.EmployeeId))
            {
                return BadRequest("Invalid EmployeeId.");
            }

            if (!await _context.Periods.AnyAsync(p => p.PeriodID == request.PeriodId))
            {
                return BadRequest("Invalid PeriodId.");
            }

            // Check for duplicate attendance record for the same employee and date
            if (await _context.Attendance.AnyAsync(a => a.EmployeeID == request.EmployeeId && a.Date == date.Date))
            {
                return Conflict("Attendance record already exists for this employee on the specified date.");
            }

            var attendance = new Attendance
            {
                AttendanceID = Guid.NewGuid(),
                EmployeeID = request.EmployeeId,
                PeriodID = request.PeriodId,
                InTime = inTime,
                OutTime = outTime,
                Status = request.Status ?? 0,
                Date = date.Date,
                GPS_Latitude = request.Latitude,
                GPS_Longitude = request.Longitude,
                PhotoURL = request.PhotoUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Attendance.Add(attendance);

            try
            {
                await _context.SaveChangesAsync();
                var response = new
                {
                    attendanceId = attendance.AttendanceID,
                    employeeId = attendance.EmployeeID,
                    periodId = attendance.PeriodID,
                    inTime = attendance.InTime.ToString(@"hh\:mm\:ss"),
                    outTime = attendance.OutTime?.ToString(@"hh\:mm\:ss"),
                    status = attendance.Status,
                    date = attendance.Date.ToString("yyyy-MM-dd"),
                    gpsLatitude = attendance.GPS_Latitude,
                    gpsLongitude = attendance.GPS_Longitude,
                    photoUrl = attendance.PhotoURL,
                    createdAt = attendance.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    updatedAt = attendance.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                };
                return CreatedAtAction(nameof(GetAttendanceById), new { id = attendance.AttendanceID }, response);
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"[AttendanceController] Database error: {ex.InnerException?.Message ?? ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, "An error occurred while saving attendance. Please try again.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AttendanceController] Unexpected error: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetAttendanceByEmployeeId(Guid employeeId)
        {
            if (!await _context.Employees.AnyAsync(e => e.EmployeeID == employeeId))
            {
                return NotFound("Employee not found.");
            }

            var attendance = await _context.Attendance
                .Where(a => a.EmployeeID == employeeId)
                .OrderByDescending(a => a.Date)
                .Select(a => new
                {
                    attendanceId = a.AttendanceID,
                    employeeId = a.EmployeeID,
                    periodId = a.PeriodID,
                    inTime = a.InTime.ToString(@"hh\:mm\:ss"),
                    outTime = a.OutTime.HasValue ? a.OutTime.Value.ToString(@"hh\:mm\:ss") : null,
                    status = a.Status,
                    date = a.Date.ToString("yyyy-MM-dd"),
                    gpsLatitude = a.GPS_Latitude,
                    gpsLongitude = a.GPS_Longitude,
                    photoUrl = a.PhotoURL,
                    createdAt = a.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    updatedAt = a.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                })
                .ToListAsync();

            if (!attendance.Any())
            {
                return NotFound("No attendance records found for the employee.");
            }

            return Ok(attendance);
        }

        [HttpGet("period/{periodId}")]
        public async Task<IActionResult> GetAttendanceByPeriodId(Guid periodId)
        {
            if (!await _context.Periods.AnyAsync(p => p.PeriodID == periodId))
            {
                return NotFound("Period not found.");
            }

            var attendance = await _context.Attendance
                .Where(a => a.PeriodID == periodId)
                .OrderByDescending(a => a.Date)
                .Select(a => new
                {
                    attendanceId = a.AttendanceID,
                    employeeId = a.EmployeeID,
                    periodId = a.PeriodID,
                    inTime = a.InTime.ToString(@"hh\:mm\:ss"),
                    outTime = a.OutTime.HasValue ? a.OutTime.Value.ToString(@"hh\:mm\:ss") : null,
                    status = a.Status,
                    date = a.Date.ToString("yyyy-MM-dd"),
                    gpsLatitude = a.GPS_Latitude,
                    gpsLongitude = a.GPS_Longitude,
                    photoUrl = a.PhotoURL,
                    createdAt = a.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    updatedAt = a.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                })
                .ToListAsync();

            if (!attendance.Any())
            {
                return NotFound("No attendance records found for the period.");
            }

            return Ok(attendance);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAttendanceById(Guid id)
        {
            var attendance = await _context.Attendance
                .Where(a => a.AttendanceID == id)
                .Select(a => new
                {
                    attendanceId = a.AttendanceID,
                    employeeId = a.EmployeeID,
                    periodId = a.PeriodID,
                    inTime = a.InTime.ToString(@"hh\:mm\:ss"),
                    outTime = a.OutTime.HasValue ? a.OutTime.Value.ToString(@"hh\:mm\:ss") : null,
                    status = a.Status,
                    date = a.Date.ToString("yyyy-MM-dd"),
                    gpsLatitude = a.GPS_Latitude,
                    gpsLongitude = a.GPS_Longitude,
                    photoUrl = a.PhotoURL,
                    createdAt = a.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    updatedAt = a.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                })
                .FirstOrDefaultAsync();

            if (attendance == null)
            {
                return NotFound("Attendance record not found.");
            }

            return Ok(attendance);
        }
    }

    public class AttendanceRequest
    {
        public Guid EmployeeId { get; set; }
        public Guid PeriodId { get; set; }
        public string? InTime { get; set; }
        public string? OutTime { get; set; }
        public int? Status { get; set; }
        public string? PhotoUrl { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? Date { get; set; }
    }
}