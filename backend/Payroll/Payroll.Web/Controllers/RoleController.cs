using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System;
using System.Threading.Tasks;

namespace payroll.web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly PayrollDbContext _context;

        public RoleController(PayrollDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            Console.WriteLine("[RoleController] Controller initialized.");
        }

        // GET: api/Role
        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                var roles = await _context.Role.ToListAsync(); // Changed from Roles to Role
                Console.WriteLine("[RoleController] Retrieved {0} roles.", roles.Count);
                return Ok(roles);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[RoleController] Error retrieving roles: {0}", ex.Message);
                return StatusCode(500, new { error = "Error retrieving roles", details = ex.Message });
            }
        }

        // GET: api/Role/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRole(Guid id)
        {
            try
            {
                var role = await _context.Role.FindAsync(id); // Changed from Roles to Role
                if (role == null)
                {
                    Console.WriteLine("[RoleController] Role with ID {0} not found.", id);
                    return NotFound();
                }
                Console.WriteLine("[RoleController] Retrieved role with ID {0}.", id);
                return Ok(role);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[RoleController] Error retrieving role: {0}", ex.Message);
                return StatusCode(500, new { error = "Error retrieving role", details = ex.Message });
            }
        }

        // POST: api/Role
        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] Role role)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    Console.WriteLine("[RoleController] Invalid role data.");
                    return BadRequest(ModelState);
                }

                role.RoleID = Guid.NewGuid(); // Ensure new GUID if not provided
                role.CreatedDate = DateTime.UtcNow;
                role.UpdatedDate = DateTime.UtcNow;

                _context.Role.Add(role); // Changed from Roles to Role
                await _context.SaveChangesAsync();
                Console.WriteLine("[RoleController] Created role with ID {0}.", role.RoleID);
                return CreatedAtAction(nameof(GetRole), new { id = role.RoleID }, role);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[RoleController] Error creating role: {0}", ex.Message);
                return StatusCode(500, new { error = "Error creating role", details = ex.Message });
            }
        }

        // PUT: api/Role/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(Guid id, [FromBody] Role role)
        {
            try
            {
                if (id != role.RoleID || !ModelState.IsValid)
                {
                    Console.WriteLine("[RoleController] Invalid role ID or data for update.");
                    return BadRequest();
                }

                var existingRole = await _context.Role.FindAsync(id); // Changed from Roles to Role
                if (existingRole == null)
                {
                    Console.WriteLine("[RoleController] Role with ID {0} not found for update.", id);
                    return NotFound();
                }

                existingRole.RoleName = role.RoleName;
                existingRole.Status = role.Status;
                existingRole.UpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                Console.WriteLine("[RoleController] Updated role with ID {0}.", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine("[RoleController] Error updating role: {0}", ex.Message);
                return StatusCode(500, new { error = "Error updating role", details = ex.Message });
            }
        }

        // DELETE: api/Role/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(Guid id)
        {
            try
            {
                var role = await _context.Role.FindAsync(id); // Changed from Roles to Role
                if (role == null)
                {
                    Console.WriteLine("[RoleController] Role with ID {0} not found for deletion.", id);
                    return NotFound();
                }

                _context.Role.Remove(role); // Changed from Roles to Role
                await _context.SaveChangesAsync();
                Console.WriteLine("[RoleController] Deleted role with ID {0}.", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine("[RoleController] Error deleting role: {0}", ex.Message);
                return StatusCode(500, new { error = "Error deleting role", details = ex.Message });
            }
        }
    }
}