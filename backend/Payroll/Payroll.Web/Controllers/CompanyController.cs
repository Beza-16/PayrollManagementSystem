using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System;

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompanyController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly JsonSerializerOptions _jsonOptions;

        public CompanyController(PayrollDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _jsonOptions = new JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            Console.WriteLine("[CompanyController] Controller initialized.");
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCompanies()
        {
            try
            {
                Console.WriteLine("[CompanyController] Querying all companies from Companies table.");
                var companies = await _context.Companies
                    .Include(c => c.Location)
                    .ToListAsync();

                var result = companies.Select(c => new
                {
                    CompanyID = c.CompanyID,
                    CompanyName = c.CompanyName,
                    PhoneNumber = c.PhoneNumber,
                    Email = c.Email,
                    City = c.Location?.city ?? "N/A",
                    Country = c.Location?.country ?? "N/A",
                    State = c.Location?.state_or_region ?? "N/A",
                    Street = c.Location?.street ?? "N/A",
                    Latitude = c.Location?.latitude ?? 0,
                    Longitude = c.Location?.longitude ?? 0,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                }).ToList();

                Console.WriteLine($"[CompanyController] Fetched {result.Count} companies successfully.");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[CompanyController] GetCompanies failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching companies", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCompany(Guid id)
        {
            try
            {
                Console.WriteLine($"[CompanyController] Querying Companies table for ID: {id}");
                var company = await _context.Companies
                    .Include(c => c.Location)
                    .FirstOrDefaultAsync(c => c.CompanyID == id);

                if (company == null)
                {
                    Console.WriteLine($"[CompanyController] Company with ID {id} not found.");
                    return NotFound(new { error = $"Company with ID {id} not found." });
                }

                var result = new
                {
                    CompanyID = company.CompanyID,
                    CompanyName = company.CompanyName,
                    PhoneNumber = company.PhoneNumber,
                    Email = company.Email,
                    City = company.Location?.city ?? "N/A",
                    Country = company.Location?.country ?? "N/A",
                    State = company.Location?.state_or_region ?? "N/A",
                    Street = company.Location?.street ?? "N/A",
                    Latitude = company.Location?.latitude ?? 0,
                    Longitude = company.Location?.longitude ?? 0,
                    CreatedAt = company.CreatedAt,
                    UpdatedAt = company.UpdatedAt
                };

                Console.WriteLine($"[CompanyController] Found company: {JsonSerializer.Serialize(result, _jsonOptions)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[CompanyController] GetCompany failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching company", details = errorMessage });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Company>> PostCompany(CompanyDto companyDto)
        {
            Console.WriteLine($"[CompanyController] Received POST request: {JsonSerializer.Serialize(companyDto, _jsonOptions)}");

            if (companyDto == null)
            {
                Console.WriteLine("[CompanyController] PostCompany failed: Company data is null.");
                return BadRequest(new { error = "Company data is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[] { "Unknown error" }
                );
                Console.WriteLine($"[CompanyController] PostCompany failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                var location = await _context.Locations.FindAsync(companyDto.location_id);
                if (location == null)
                {
                    Console.WriteLine($"[CompanyController] Location with ID {companyDto.location_id} not found.");
                    return BadRequest(new { error = $"Location with ID '{companyDto.location_id}' does not exist." });
                }

                var company = new Company
                {
                    CompanyID = Guid.NewGuid(),
                    CompanyName = companyDto.CompanyName ?? throw new ArgumentNullException(nameof(companyDto.CompanyName)),
                    PhoneNumber = companyDto.PhoneNumber,
                    Email = companyDto.Email,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    location_id = companyDto.location_id
                };

                Console.WriteLine($"[CompanyController] Attempting to save company: {JsonSerializer.Serialize(company, _jsonOptions)}");
                _context.Companies.Add(company);
                await _context.SaveChangesAsync();

                var savedCompany = await _context.Companies
                    .Include(c => c.Location)
                    .FirstOrDefaultAsync(c => c.CompanyID == company.CompanyID);

                if (savedCompany == null)
                {
                    Console.WriteLine($"[CompanyController] Failed to reload company with ID: {company.CompanyID}");
                    return StatusCode(500, new { error = "Failed to reload saved company" });
                }

                Console.WriteLine($"[CompanyController] Company saved successfully with ID: {company.CompanyID}, Location: {JsonSerializer.Serialize(savedCompany.Location, _jsonOptions)}");
                return CreatedAtAction(nameof(GetCompany), new { id = company.CompanyID }, new
                {
                    CompanyID = savedCompany.CompanyID,
                    CompanyName = savedCompany.CompanyName,
                    PhoneNumber = savedCompany.PhoneNumber,
                    Email = savedCompany.Email,
                    City = savedCompany.Location?.city ?? "N/A",
                    Country = savedCompany.Location?.country ?? "N/A",
                    State = savedCompany.Location?.state_or_region ?? "N/A",
                    Street = savedCompany.Location?.street ?? "N/A",
                    Latitude = savedCompany.Location?.latitude ?? 0,
                    Longitude = savedCompany.Location?.longitude ?? 0,
                    CreatedAt = savedCompany.CreatedAt,
                    UpdatedAt = savedCompany.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[CompanyController] PostCompany failed: {errorMessage}\nCompany: {JsonSerializer.Serialize(companyDto, _jsonOptions)}");
                return StatusCode(500, new { error = "An error occurred while creating the company", details = errorMessage });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCompany(Guid id, [FromBody] CompanyDto companyDto)
        {
            Console.WriteLine($"[CompanyController] Received PUT request for ID: {id}, Data: {JsonSerializer.Serialize(companyDto, _jsonOptions)}");

            if (companyDto == null)
            {
                Console.WriteLine("[CompanyController] PutCompany failed: Company data is null.");
                return BadRequest(new { error = "Company data is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[] { "Unknown error" }
                );
                Console.WriteLine($"[CompanyController] PutCompany failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                Console.WriteLine($"[CompanyController] Querying Companies table for ID: {id}");
                var company = await _context.Companies
                    .Include(c => c.Location)
                    .FirstOrDefaultAsync(c => c.CompanyID == id);

                if (company == null)
                {
                    Console.WriteLine($"[CompanyController] Company with ID {id} not found.");
                    return NotFound(new { error = $"Company with ID {id} not found." });
                }

                var location = await _context.Locations.FindAsync(companyDto.location_id);
                if (location == null)
                {
                    Console.WriteLine($"[CompanyController] Location with ID {companyDto.location_id} not found.");
                    return BadRequest(new { error = $"Location with ID '{companyDto.location_id}' does not exist." });
                }

                company.CompanyName = companyDto.CompanyName ?? throw new ArgumentNullException(nameof(companyDto.CompanyName));
                company.PhoneNumber = companyDto.PhoneNumber;
                company.Email = companyDto.Email;
                company.location_id = companyDto.location_id;
                company.UpdatedAt = DateTime.UtcNow;

                Console.WriteLine($"[CompanyController] Updating company: {JsonSerializer.Serialize(company, _jsonOptions)}");
                _context.Companies.Update(company);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[CompanyController] Company updated successfully with ID: {id}");
                return Ok(new
                {
                    CompanyID = company.CompanyID,
                    CompanyName = company.CompanyName,
                    PhoneNumber = company.PhoneNumber,
                    Email = company.Email,
                    City = company.Location?.city ?? "N/A",
                    Country = company.Location?.country ?? "N/A",
                    State = company.Location?.state_or_region ?? "N/A",
                    Street = company.Location?.street ?? "N/A",
                    Latitude = company.Location?.latitude ?? 0,
                    Longitude = company.Location?.longitude ?? 0,
                    CreatedAt = company.CreatedAt,
                    UpdatedAt = company.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[CompanyController] PutCompany failed: {errorMessage}\nCompany: {JsonSerializer.Serialize(companyDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Failed to update company", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[CompanyController] PutCompany failed: {errorMessage}\nCompany: {JsonSerializer.Serialize(companyDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Unexpected error", details = errorMessage });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(Guid id)
        {
            Console.WriteLine($"[CompanyController] Received DELETE request for ID: {id}");

            try
            {
                Console.WriteLine($"[CompanyController] Querying Companies table for ID: {id}");
                var company = await _context.Companies
                    .Include(c => c.Location)
                    .FirstOrDefaultAsync(c => c.CompanyID == id);

                if (company == null)
                {
                    Console.WriteLine($"[CompanyController] Company with ID {id} not found.");
                    return NotFound(new { error = $"Company with ID {id} not found." });
                }

                if (company.location_id.HasValue)
                {
                    Console.WriteLine($"[CompanyController] Setting location_id to NULL for company ID: {id}");
                    company.location_id = null;
                    _context.Companies.Update(company);
                }

                Console.WriteLine($"[CompanyController] Deleting company: {JsonSerializer.Serialize(company, _jsonOptions)}");
                _context.Companies.Remove(company);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[CompanyController] Company deleted successfully with ID: {id}");
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[CompanyController] DeleteCompany failed: {errorMessage}");
                return StatusCode(500, new { error = "Failed to delete company", details = ex.InnerException?.Message ?? errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine("[CompanyController] DeleteCompany failed: {errorMessage}");
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

    public class CompanyDto
    {
        [Required]
        public string CompanyName { get; set; } = null!;

        public string? PhoneNumber { get; set; }

        public string? Email { get; set; }

        [Required]
        public Guid location_id { get; set; }
    }
}