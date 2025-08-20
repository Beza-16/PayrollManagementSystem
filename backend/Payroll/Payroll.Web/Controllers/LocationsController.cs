using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LocationController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly JsonSerializerOptions _jsonOptions;

        public LocationController(PayrollDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _jsonOptions = new JsonSerializerOptions
            {
                ReferenceHandler = ReferenceHandler.IgnoreCycles,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true // For better readability in responses
            };
            Console.WriteLine("[LocationController] Controller initialized.");
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetLocation(Guid id)
        {
            try
            {
                Console.WriteLine($"[LocationController] Querying Locations table for ID: {id}");
                var location = await _context.Locations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.location_id == id);

                if (location == null)
                {
                    Console.WriteLine($"[LocationController] Location with ID {id} not found.");
                    return NotFound(new { error = $"Location with ID {id} not found.", timestamp = DateTime.UtcNow });
                }

                var result = new
                {
                    location_id = location.location_id,
                    country = location.country,
                    state_or_region = location.state_or_region,
                    city = location.city,
                    street = location.street,
                    latitude = location.latitude,
                    longitude = location.longitude,
                    created_at = location.created_at,
                    UpdatedAt = location.UpdatedAt // Changed from updated_at
                };

                Console.WriteLine($"[LocationController] Found location: {JsonSerializer.Serialize(result, _jsonOptions)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMethod(ex); // Fixed from GetFullErrorMessage to match method name
                Console.WriteLine($"[LocationController] GetLocation failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching location", details = errorMessage, timestamp = DateTime.UtcNow });
            }
        }

        [HttpPost]
        public async Task<ActionResult<object>> PostLocation([FromBody] LocationDto locationDto)
        {
            Console.WriteLine($"[LocationController] Received POST request: {JsonSerializer.Serialize(locationDto, _jsonOptions)}");

            if (locationDto == null)
            {
                Console.WriteLine("[LocationController] PostLocation failed: Location data is null.");
                return BadRequest(new { error = "Location data is null", timestamp = DateTime.UtcNow });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                );
                Console.WriteLine($"[LocationController] PostLocation failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors, timestamp = DateTime.UtcNow });
            }

            // Validate latitude and longitude range
            if (locationDto.latitude.HasValue && (locationDto.latitude < -90m || locationDto.latitude > 90m))
            {
                return BadRequest(new { error = "Latitude must be between -90 and 90 degrees", timestamp = DateTime.UtcNow });
            }
            if (locationDto.longitude.HasValue && (locationDto.longitude < -180m || locationDto.longitude > 180m))
            {
                return BadRequest(new { error = "Longitude must be between -180 and 180 degrees", timestamp = DateTime.UtcNow });
            }

            try
            {
                var location = new Location
                {
                    location_id = Guid.NewGuid(),
                    country = locationDto.country ?? throw new ArgumentNullException(nameof(locationDto.country)),
                    state_or_region = locationDto.state_or_region,
                    city = locationDto.city ?? throw new ArgumentNullException(nameof(locationDto.city)),
                    street = locationDto.street,
                    latitude = locationDto.latitude ?? 0m, // Default to 0 if null, though database requires non-null
                    longitude = locationDto.longitude ?? 0m, // Default to 0 if null, though database requires non-null
                    created_at = locationDto.created_at ?? DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow // Changed from updated_at
                };

                _context.Locations.Add(location);
                await _context.SaveChangesAsync();

                var savedLocation = await _context.Locations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.location_id == location.location_id);

                if (savedLocation == null)
                {
                    Console.WriteLine($"[LocationController] Failed to reload location with ID: {location.location_id}");
                    return StatusCode(500, new { error = "Failed to reload saved location", timestamp = DateTime.UtcNow });
                }

                Console.WriteLine($"[LocationController] Location saved successfully with ID: {location.location_id}");
                return CreatedAtAction(nameof(GetLocation), new { id = savedLocation.location_id }, new
                {
                    location_id = savedLocation.location_id,
                    country = savedLocation.country,
                    state_or_region = savedLocation.state_or_region,
                    city = savedLocation.city,
                    street = savedLocation.street,
                    latitude = savedLocation.latitude,
                    longitude = savedLocation.longitude,
                    created_at = savedLocation.created_at,
                    UpdatedAt = savedLocation.UpdatedAt // Changed from updated_at
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMethod(ex); // Fixed from GetFullErrorMessage to match method name
                Console.WriteLine($"[LocationController] PostLocation failed: {errorMessage}");
                return StatusCode(500, new { error = "An error occurred while creating the location", details = errorMessage, timestamp = DateTime.UtcNow });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutLocation(Guid id, [FromBody] LocationDto locationDto)
        {
            Console.WriteLine($"[LocationController] Received PUT request for ID: {id}, Data: {JsonSerializer.Serialize(locationDto, _jsonOptions)}");

            if (locationDto == null)
            {
                Console.WriteLine("[LocationController] PutLocation failed: Location data is null.");
                return BadRequest(new { error = "Location data is null", timestamp = DateTime.UtcNow });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                );
                Console.WriteLine($"[LocationController] PutLocation failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors, timestamp = DateTime.UtcNow });
            }

            if (locationDto.latitude.HasValue && (locationDto.latitude < -90m || locationDto.latitude > 90m))
            {
                return BadRequest(new { error = "Latitude must be between -90 and 90 degrees", timestamp = DateTime.UtcNow });
            }
            if (locationDto.longitude.HasValue && (locationDto.longitude < -180m || locationDto.longitude > 180m))
            {
                return BadRequest(new { error = "Longitude must be between -180 and 180 degrees", timestamp = DateTime.UtcNow });
            }

            try
            {
                var location = await _context.Locations.FindAsync(id);
                if (location == null)
                {
                    Console.WriteLine($"[LocationController] Location with ID {id} not found.");
                    return NotFound(new { error = $"Location with ID {id} not found.", timestamp = DateTime.UtcNow });
                }

                location.country = locationDto.country ?? throw new ArgumentNullException(nameof(locationDto.country));
                location.state_or_region = locationDto.state_or_region;
                location.city = locationDto.city ?? throw new ArgumentNullException(nameof(locationDto.city));
                location.street = locationDto.street;
                location.latitude = locationDto.latitude ?? location.latitude; // Preserve existing if null
                location.longitude = locationDto.longitude ?? location.longitude; // Preserve existing if null
                location.UpdatedAt = DateTime.UtcNow; // Changed from updated_at

                _context.Locations.Update(location);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[LocationController] Location updated successfully with ID: {id}");
                return Ok(new
                {
                    location_id = location.location_id,
                    country = location.country,
                    state_or_region = location.state_or_region,
                    city = location.city,
                    street = location.street,
                    latitude = location.latitude,
                    longitude = location.longitude,
                    created_at = location.created_at,
                    UpdatedAt = location.UpdatedAt // Changed from updated_at
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMethod(ex); // Fixed from GetFullErrorMessage to match method name
                Console.WriteLine($"[LocationController] PutLocation failed: {errorMessage}");
                return StatusCode(500, new { error = "Failed to update location", details = errorMessage, timestamp = DateTime.UtcNow });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(Guid id)
        {
            Console.WriteLine($"[LocationController] Received DELETE request for ID: {id}");

            try
            {
                var location = await _context.Locations.FindAsync(id);
                if (location == null)
                {
                    Console.WriteLine($"[LocationController] Location with ID {id} not found.");
                    return NotFound(new { error = $"Location with ID {id} not found.", timestamp = DateTime.UtcNow });
                }

                _context.Locations.Remove(location);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[LocationController] Location deleted successfully with ID: {id}");
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMethod(ex); // Fixed from GetFullErrorMessage to match method name
                Console.WriteLine($"[LocationController] DeleteLocation failed: {errorMessage}");
                return StatusCode(500, new { error = "Failed to delete location", details = errorMessage, timestamp = DateTime.UtcNow });
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAllLocations()
        {
            try
            {
                Console.WriteLine("[LocationController] Querying all locations from Locations table.");
                var locations = await _context.Locations
                    .AsNoTracking()
                    .ToListAsync();

                var result = locations.Select(l => new
                {
                    location_id = l.location_id,
                    country = l.country,
                    state_or_region = l.state_or_region,
                    city = l.city,
                    street = l.street,
                    latitude = l.latitude,
                    longitude = l.longitude,
                    created_at = l.created_at,
                    UpdatedAt = l.UpdatedAt // Changed from updated_at
                }).ToList();

                Console.WriteLine($"[LocationController] Fetched {result.Count} locations successfully.");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMethod(ex); // Fixed from GetFullErrorMessage to match method name
                Console.WriteLine($"[LocationController] GetAllLocations failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching locations", details = errorMessage, timestamp = DateTime.UtcNow });
            }
        }

        private static string GetFullErrorMethod(Exception ex) // Renamed to match usage
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

    public class LocationDto
    {
        [Required]
        [MaxLength(50)]
        public string? country { get; set; }

        [MaxLength(100)]
        public string? state_or_region { get; set; }

        [Required]
        [MaxLength(100)]
        public string? city { get; set; }

        [MaxLength(200)]
        public string? street { get; set; }

        [Column(TypeName = "decimal(9,6)")]
        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90 degrees")]
        public decimal? latitude { get; set; }

        [Column(TypeName = "decimal(9,6)")]
        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180 degrees")]
        public decimal? longitude { get; set; }

        public DateTime? created_at { get; set; }
    }
}