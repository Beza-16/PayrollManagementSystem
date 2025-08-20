using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using payroll.web.Data;

namespace payroll.web.Data
{
    public class PayrollDbContextFactory : IDesignTimeDbContextFactory<PayrollDbContext>
    {
        public PayrollDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<PayrollDbContext>();
            var connectionString = "Server=localhost\\MSSQLSERVER02;Database=PayrollManagementSystem;Trusted_Connection=True;TrustServerCertificate=True;";
            optionsBuilder.UseSqlServer(connectionString);

            return new PayrollDbContext(optionsBuilder.Options);
        }
    }
}