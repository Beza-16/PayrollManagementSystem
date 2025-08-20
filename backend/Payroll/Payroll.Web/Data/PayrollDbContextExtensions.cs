using Microsoft.EntityFrameworkCore;
using payroll.web.Models;

namespace payroll.web.Data
{
    public static class PayrollDbContextExtensions
    {
        /// <summary>
        /// Ends an active work arrangement for an employee
        /// </summary>
        public static async Task<bool> EndWorkArrangementAsync(this PayrollDbContext context, Guid employeeId, DateTime endDate, int? terminationReasonId = null)
        {
            var activeArrangement = await context.GetActiveWorkArrangementAsync(employeeId);
            if (activeArrangement == null)
                return false;

            activeArrangement.EndDate = endDate;
            activeArrangement.TerminationReasonID = terminationReasonId;
            activeArrangement.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Creates a new work arrangement, ending any existing active arrangement
        /// </summary>
        public static async Task<WorkArrangement> CreateWorkArrangementAsync(this PayrollDbContext context, WorkArrangement workArrangement)
        {
            // End any existing active arrangement
            if (await context.HasActiveWorkArrangementAsync(workArrangement.EmployeeID))
            {
                await context.EndWorkArrangementAsync(workArrangement.EmployeeID, workArrangement.StartDate.AddDays(-1));
            }

            workArrangement.CreatedAt = DateTime.UtcNow;
            workArrangement.UpdatedAt = DateTime.UtcNow;

            context.WorkArrangements.Add(workArrangement);
            await context.SaveChangesAsync();

            return workArrangement;
        }

        /// <summary>
        /// Gets work arrangements by arrangement type
        /// </summary>
        public static async Task<IEnumerable<WorkArrangement>> GetWorkArrangementsByTypeAsync(this PayrollDbContext context, int arrangementTypeId)
        {
            return await context.WorkArrangements
                .Include(wa => wa.Employee)
                .Include(wa => wa.ArrangementType)
                .Include(wa => wa.PensionPlan)
                .Include(wa => wa.CostSharingType)
                .Include(wa => wa.TaxStatus)
                .Where(wa => wa.ArrangementTypeID == arrangementTypeId && wa.EndDate == null)
                .OrderBy(wa => wa.Employee.FullName)
                .ToListAsync();
        }

        /// <summary>
        /// Gets work arrangements by date range
        /// </summary>
        public static async Task<IEnumerable<WorkArrangement>> GetWorkArrangementsByDateRangeAsync(this PayrollDbContext context, DateTime startDate, DateTime endDate)
        {
            return await context.WorkArrangements
                .Include(wa => wa.Employee)
                .Include(wa => wa.ArrangementType)
                .Include(wa => wa.PensionPlan)
                .Include(wa => wa.CostSharingType)
                .Include(wa => wa.TaxStatus)
                .Where(wa => wa.StartDate <= endDate && (wa.EndDate == null || wa.EndDate >= startDate))
                .OrderBy(wa => wa.StartDate)
                .ToListAsync();
        }

        /// <summary>
        /// Gets employees without work arrangements
        /// </summary>
        public static async Task<IEnumerable<Employee>> GetEmployeesWithoutWorkArrangementsAsync(this PayrollDbContext context)
        {
            return await context.Employees
                .Where(e => !context.WorkArrangements.Any(wa => wa.EmployeeID == e.EmployeeID && wa.EndDate == null))
                .OrderBy(e => e.FullName)
                .ToListAsync();
        }

        /// <summary>
        /// Validates work arrangement data
        /// </summary>
        public static async Task<(bool IsValid, List<string> Errors)> ValidateWorkArrangementAsync(this PayrollDbContext context, WorkArrangement workArrangement)
        {
            var errors = new List<string>();

            // Check if employee exists
            var employee = await context.Employees.FindAsync(workArrangement.EmployeeID);
            if (employee == null)
                errors.Add("Employee not found");

            // Check if arrangement type exists
            var arrangementType = await context.ArrangementTypes.FindAsync(workArrangement.ArrangementTypeID);
            if (arrangementType == null)
                errors.Add("Arrangement type not found");

            // Check if pension plan exists
            var pensionPlan = await context.PensionPlans.FindAsync(workArrangement.PensionPlanID);
            if (pensionPlan == null)
                errors.Add("Pension plan not found");

            // Check if cost sharing type exists
            var costSharingType = await context.CostSharingTypes.FindAsync(workArrangement.CostSharingTypeID);
            if (costSharingType == null)
                errors.Add("Cost sharing type not found");

            // Check if tax status exists
            var taxStatus = await context.TaxStatuses.FindAsync(workArrangement.TaxStatusID);
            if (taxStatus == null)
                errors.Add("Tax status not found");

            // Check if termination reason exists (if provided)
            if (workArrangement.TerminationReasonID.HasValue)
            {
                var terminationReason = await context.TerminationReasons.FindAsync(workArrangement.TerminationReasonID.Value);
                if (terminationReason == null)
                    errors.Add("Termination reason not found");
            }

            // Business rule validations
            if (workArrangement.EndDate.HasValue && workArrangement.EndDate <= workArrangement.StartDate)
                errors.Add("End date must be after start date");

            if (workArrangement.PensionRate.HasValue && (workArrangement.PensionRate < 0 || workArrangement.PensionRate > 100))
                errors.Add("Pension rate must be between 0 and 100");

            if (workArrangement.PartialTaxRate.HasValue && (workArrangement.PartialTaxRate < 0 || workArrangement.PartialTaxRate > 100))
                errors.Add("Partial tax rate must be between 0 and 100");

            if (workArrangement.CostSharingValue.HasValue && workArrangement.CostSharingValue < 0)
                errors.Add("Cost sharing value cannot be negative");

            return (errors.Count == 0, errors);
        }
    }
}
