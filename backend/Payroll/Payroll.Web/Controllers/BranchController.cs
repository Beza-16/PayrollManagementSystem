using Microsoft.AspNetCore.Authorization;
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

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BranchController : ControllerBase
    {
        private readonly PayrollDbContext _context;
        private readonly JsonSerializerOptions _jsonOptions;

        public BranchController(PayrollDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _jsonOptions = new JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            Console.WriteLine("[BranchController] Controller initialized.");
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetBranches()
        {
            try
            {
                Console.WriteLine("[BranchController] Querying all branches from Branches table.");
                var branches = await _context.Branches
                    .Include(b => b.Company)
                    .Include(b => b.Location)
                    .AsNoTracking()
                    .ToListAsync();

                var result = branches.Select(branch => new
                {
                    branch.BranchID,
                    branch.CompanyID,
                    CompanyName = branch.Company?.CompanyName ?? "N/A",
                    branch.BranchName,
                    branch.PhoneNumber,
                    branch.Email,
                    City = branch.Location?.city ?? "N/A",
                    Country = branch.Location?.country ?? "N/A",
                    State = branch.Location?.state_or_region ?? "N/A",
                    Street = branch.Location?.street ?? "N/A",
                    Latitude = branch.Location?.latitude ?? 0,
                    Longitude = branch.Location?.longitude ?? 0,
                    branch.CreatedAt,
                    branch.UpdatedAt
                }).ToList();

                Console.WriteLine($"[BranchController] Fetched {result.Count} branches successfully.");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[BranchController] GetBranches failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching branches", details = errorMessage });
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetBranch(Guid id)
        {
            try
            {
                Console.WriteLine($"[BranchController] Querying Branches table for ID: {id}");
                var branch = await _context.Branches
                    .Include(b => b.Company)
                    .Include(b => b.Location)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(b => b.BranchID == id);

                if (branch == null)
                {
                    Console.WriteLine($"[BranchController] Branch with ID {id} not found.");
                    return NotFound(new { error = $"Branch with ID {id} not found." });
                }

                var result = new
                {
                    branch.BranchID,
                    branch.CompanyID,
                    CompanyName = branch.Company?.CompanyName ?? "N/A",
                    branch.BranchName,
                    branch.PhoneNumber,
                    branch.Email,
                    City = branch.Location?.city ?? "N/A",
                    Country = branch.Location?.country ?? "N/A",
                    State = branch.Location?.state_or_region ?? "N/A",
                    Street = branch.Location?.street ?? "N/A",
                    Latitude = branch.Location?.latitude ?? 0,
                    Longitude = branch.Location?.longitude ?? 0,
                    branch.CreatedAt,
                    branch.UpdatedAt
                };

                Console.WriteLine($"[BranchController] Found branch: {JsonSerializer.Serialize(result, _jsonOptions)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[BranchController] GetBranch failed: {errorMessage}");
                return StatusCode(500, new { error = "Error fetching branch", details = errorMessage });
            }
        }

        [HttpPost]
        public async Task<ActionResult<object>> PostBranch(BranchDto branchDto)
        {
            Console.WriteLine($"[BranchController] Received POST request: {JsonSerializer.Serialize(branchDto, _jsonOptions)}");

            if (branchDto == null)
            {
                Console.WriteLine("[BranchController] PostBranch failed: Branch data is null.");
                return BadRequest(new { error = "Branch data is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                );
                Console.WriteLine($"[BranchController] PostBranch failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                var company = await _context.Companies.FindAsync(branchDto.CompanyID);
                if (company == null)
                {
                    Console.WriteLine($"[BranchController] Company with ID {branchDto.CompanyID} not found.");
                    return BadRequest(new { error = $"Company with ID '{branchDto.CompanyID}' does not exist." });
                }

                Guid? locationId = null;
                if (branchDto.LocationID.HasValue && branchDto.LocationID != Guid.Empty)
                {
                    var location = await _context.Locations.FindAsync(branchDto.LocationID.Value);
                    if (location == null)
                    {
                        Console.WriteLine($"[BranchController] Location with ID {branchDto.LocationID} not found, setting location_id to null.");
                    }
                    else
                    {
                        locationId = branchDto.LocationID;
                    }
                }

                var branch = new Branch
                {
                    BranchID = Guid.NewGuid(),
                    CompanyID = branchDto.CompanyID,
                    BranchName = branchDto.BranchName ?? string.Empty,
                    PhoneNumber = branchDto.PhoneNumber,
                    Email = branchDto.Email,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    location_id = locationId
                };

                _context.Branches.Add(branch);
                await _context.SaveChangesAsync();

                var savedBranch = await _context.Branches
                    .Include(b => b.Company)
                    .Include(b => b.Location)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(b => b.BranchID == branch.BranchID);

                if (savedBranch == null)
                {
                    Console.WriteLine($"[BranchController] Failed to reload branch with ID: {branch.BranchID}");
                    return StatusCode(500, new { error = "Failed to reload saved branch" });
                }

                Console.WriteLine($"[BranchController] Branch saved successfully with ID: {branch.BranchID}");
                return CreatedAtAction(nameof(GetBranch), new { id = branch.BranchID }, new
                {
                    savedBranch.BranchID,
                    savedBranch.CompanyID,
                    CompanyName = savedBranch.Company?.CompanyName ?? "N/A",
                    savedBranch.BranchName,
                    savedBranch.PhoneNumber,
                    savedBranch.Email,
                    City = savedBranch.Location?.city ?? "N/A",
                    Country = savedBranch.Location?.country ?? "N/A",
                    State = savedBranch.Location?.state_or_region ?? "N/A",
                    Street = savedBranch.Location?.street ?? "N/A",
                    Latitude = savedBranch.Location?.latitude ?? 0,
                    Longitude = savedBranch.Location?.longitude ?? 0,
                    savedBranch.CreatedAt,
                    savedBranch.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[BranchController] PostBranch failed: {errorMessage}\nBranch: {JsonSerializer.Serialize(branchDto, _jsonOptions)}");
                return StatusCode(500, new { error = "An error occurred while creating the branch", details = errorMessage });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutBranch(Guid id, [FromBody] BranchDto branchDto)
        {
            Console.WriteLine($"[BranchController] Received PUT request for ID: {id}, Data: {JsonSerializer.Serialize(branchDto, _jsonOptions)}");

            if (branchDto == null)
            {
                Console.WriteLine("[BranchController] PutBranch failed: Branch data is null.");
                return BadRequest(new { error = "Branch data is null" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                );
                Console.WriteLine($"[BranchController] PutBranch failed: Invalid model state - {JsonSerializer.Serialize(errors, _jsonOptions)}");
                return BadRequest(new { errors });
            }

            try
            {
                var branch = await _context.Branches
                    .Include(b => b.Company)
                    .Include(b => b.Location)
                    .FirstOrDefaultAsync(b => b.BranchID == id);

                if (branch == null)
                {
                    Console.WriteLine($"[BranchController] Branch with ID {id} not found.");
                    return NotFound(new { error = $"Branch with ID {id} not found." });
                }

                var company = await _context.Companies.FindAsync(branchDto.CompanyID);
                if (company == null)
                {
                    Console.WriteLine($"[BranchController] Company with ID {branchDto.CompanyID} not found.");
                    return BadRequest(new { error = $"Company with ID '{branchDto.CompanyID}' does not exist." });
                }

                Guid? locationId = null;
                if (branchDto.LocationID.HasValue && branchDto.LocationID != Guid.Empty)
                {
                    var location = await _context.Locations.FindAsync(branchDto.LocationID.Value);
                    if (location == null)
                    {
                        Console.WriteLine($"[BranchController] Location with ID {branchDto.LocationID} not found, setting location_id to null.");
                    }
                    else
                    {
                        locationId = branchDto.LocationID;
                    }
                }

                branch.CompanyID = branchDto.CompanyID;
                branch.BranchName = branchDto.BranchName ?? string.Empty;
                branch.PhoneNumber = branchDto.PhoneNumber;
                branch.Email = branchDto.Email;
                branch.location_id = locationId;
                branch.UpdatedAt = DateTime.UtcNow;

                _context.Branches.Update(branch);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[BranchController] Branch updated successfully with ID: {id}");
                return Ok(new
                {
                    branch.BranchID,
                    branch.CompanyID,
                    CompanyName = branch.Company?.CompanyName ?? "N/A",
                    branch.BranchName,
                    branch.PhoneNumber,
                    branch.Email,
                    City = branch.Location?.city ?? "N/A",
                    Country = branch.Location?.country ?? "N/A",
                    State = branch.Location?.state_or_region ?? "N/A",
                    Street = branch.Location?.street ?? "N/A",
                    Latitude = branch.Location?.latitude ?? 0,
                    Longitude = branch.Location?.longitude ?? 0,
                    branch.CreatedAt,
                    branch.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[BranchController] PutBranch failed: {errorMessage}\nBranch: {JsonSerializer.Serialize(branchDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Failed to update branch", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[BranchController] PutBranch failed: {errorMessage}\nBranch: {JsonSerializer.Serialize(branchDto, _jsonOptions)}");
                return StatusCode(500, new { error = "Unexpected error", details = errorMessage });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBranch(Guid id)
        {
            Console.WriteLine($"[BranchController] Received DELETE request for ID: {id}");

            try
            {
                var branch = await _context.Branches
                    .Include(b => b.Location)
                    .Include(b => b.Departments)
                    .FirstOrDefaultAsync(b => b.BranchID == id);

                if (branch == null)
                {
                    Console.WriteLine($"[BranchController] Branch with ID {id} not found.");
                    return NotFound(new { error = $"Branch with ID {id} not found." });
                }

                if (branch.location_id != null)
                {
                    branch.location_id = null;
                    _context.Branches.Update(branch);
                }

                _context.Branches.Remove(branch);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[BranchController] Branch deleted successfully with ID: {id}");
                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[BranchController] DeleteBranch failed: {errorMessage}");
                return StatusCode(500, new { error = "Failed to delete branch", details = errorMessage });
            }
            catch (Exception ex)
            {
                var errorMessage = GetFullErrorMessage(ex);
                Console.WriteLine($"[BranchController] DeleteBranch failed: {errorMessage}");
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

    public class BranchDto
    {
        [Required]
        public Guid CompanyID { get; set; }

        [Required]
        [MaxLength(50)]
        public string? BranchName { get; set; }

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(50)]
        public string? Email { get; set; }

        public Guid? LocationID { get; set; }
    }
}