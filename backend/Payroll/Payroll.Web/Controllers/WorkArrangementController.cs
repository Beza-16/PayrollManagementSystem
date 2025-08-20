using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using payroll.web.Data;
using payroll.web.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace payroll.web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkArrangementController : ControllerBase
    {
        private readonly PayrollDbContext _context;

        public WorkArrangementController(PayrollDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorkArrangement>>> GetWorkArrangements()
        {
            return await _context.WorkArrangements
                .Include(wa => wa.Employee)
                .Include(wa => wa.ArrangementType)
                .Include(wa => wa.PensionPlan)
                .Include(wa => wa.CostSharingType)
                .Include(wa => wa.TaxStatus)
                .Include(wa => wa.TerminationReason)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WorkArrangement>> GetWorkArrangement(Guid id)
        {
            var workArrangement = await _context.WorkArrangements
                .Include(wa => wa.Employee)
                .Include(wa => wa.ArrangementType)
                .Include(wa => wa.PensionPlan)
                .Include(wa => wa.CostSharingType)
                .Include(wa => wa.TaxStatus)
                .Include(wa => wa.TerminationReason)
                .FirstOrDefaultAsync(wa => wa.WorkArrangementID == id);

            if (workArrangement == null)
            {
                return NotFound();
            }

            return workArrangement;
        }

        [HttpPost]
        public async Task<ActionResult<WorkArrangement>> PostWorkArrangement(WorkArrangement workArrangement)
        {
            if (workArrangement.EndDate.HasValue && workArrangement.EndDate <= workArrangement.StartDate)
            {
                return BadRequest("EndDate must be after StartDate.");
            }

            if (workArrangement.PensionRate.HasValue && (workArrangement.PensionRate < 0 || workArrangement.PensionRate > 100))
            {
                return BadRequest("PensionRate must be between 0 and 100.");
            }

            if (workArrangement.PartialTaxRate.HasValue && (workArrangement.PartialTaxRate < 0 || workArrangement.PartialTaxRate > 100))
            {
                return BadRequest("PartialTaxRate must be between 0 and 100.");
            }

            var partialStatus = await _context.Set<TaxStatus>().FirstOrDefaultAsync(ts => ts.Description == "Partial");
            if (workArrangement.TaxStatusID == partialStatus?.StatusID && !workArrangement.PartialTaxRate.HasValue)
            {
                return BadRequest("PartialTaxRate is required when TaxStatus is Partial.");
            }

            var activeArrangements = await _context.WorkArrangements
                .Where(wa => wa.EmployeeID == workArrangement.EmployeeID && wa.EndDate == null)
                .ToListAsync();

            if (activeArrangements.Any() && workArrangement.EndDate == null)
            {
                return BadRequest("Employee already has an active arrangement.");
            }

            _context.WorkArrangements.Add(workArrangement);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetWorkArrangement), new { id = workArrangement.WorkArrangementID }, workArrangement);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutWorkArrangement(Guid id, WorkArrangement workArrangement)
        {
            if (id != workArrangement.WorkArrangementID)
            {
                return BadRequest();
            }

            if (workArrangement.EndDate.HasValue && workArrangement.EndDate <= workArrangement.StartDate)
            {
                return BadRequest("EndDate must be after StartDate.");
            }

            if (workArrangement.PensionRate.HasValue && (workArrangement.PensionRate < 0 || workArrangement.PensionRate > 100))
            {
                return BadRequest("PensionRate must be between 0 and 100.");
            }

            if (workArrangement.PartialTaxRate.HasValue && (workArrangement.PartialTaxRate < 0 || workArrangement.PartialTaxRate > 100))
            {
                return BadRequest("PartialTaxRate must be between 0 and 100.");
            }

            var partialStatus = await _context.Set<TaxStatus>().FirstOrDefaultAsync(ts => ts.Description == "Partial");
            if (workArrangement.TaxStatusID == partialStatus?.StatusID && !workArrangement.PartialTaxRate.HasValue)
            {
                return BadRequest("PartialTaxRate is required when TaxStatus is Partial.");
            }

            workArrangement.UpdatedAt = DateTime.UtcNow;
            _context.Entry(workArrangement).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.WorkArrangements.AnyAsync(e => e.WorkArrangementID == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkArrangement(Guid id)
        {
            var workArrangement = await _context.WorkArrangements.FindAsync(id);
            if (workArrangement == null)
            {
                return NotFound();
            }

            _context.WorkArrangements.Remove(workArrangement);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}