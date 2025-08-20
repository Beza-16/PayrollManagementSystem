using Microsoft.EntityFrameworkCore;
using payroll.web.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace payroll.web.Data
{
    public class PayrollDbContext : DbContext
    {
        public PayrollDbContext(DbContextOptions<PayrollDbContext> options)
            : base(options)
        {
            Console.WriteLine("[PayrollDbContext] Initializing DbContext with options...");
        }

        public DbSet<Company> Companies { get; set; } = null!;
        public DbSet<Branch> Branches { get; set; } = null!;
        public DbSet<Location> Locations { get; set; } = null!;
        public DbSet<User> User { get; set; } = null!; // Updated to singular "User" to match table name
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = null!;
        public DbSet<Department> Departments { get; set; } = null!;
        public DbSet<Designation> Designations { get; set; } = null!;
        public DbSet<Employee> Employees { get; set; } = null!;
        public DbSet<WorkArrangement> WorkArrangements { get; set; } = null!;
        public DbSet<LeaveType> LeaveTypes { get; set; } = null!;
        public DbSet<Leave> Leaves { get; set; } = null!;
        public DbSet<Period> Periods { get; set; } = null!;
        public DbSet<ArrangementType> ArrangementTypes { get; set; } = null!;
        public DbSet<PensionPlan> PensionPlans { get; set; } = null!;
        public DbSet<CostSharingType> CostSharingTypes { get; set; } = null!;
        public DbSet<TaxStatus> TaxStatuses { get; set; } = null!;
        public DbSet<TerminationReason> TerminationReasons { get; set; } = null!;
        public DbSet<Attendance> Attendance { get; set; } = null!;
        public DbSet<Role> Role { get; set; } = null!; // Singular to match table name "Role"

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            try
            {
                optionsBuilder.EnableDetailedErrors();
                if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                {
                    optionsBuilder.EnableSensitiveDataLogging();
                    Console.WriteLine("[PayrollDbContext] Sensitive data logging enabled for Development environment.");
                }
                Console.WriteLine("[PayrollDbContext] Configuring DbContext with connection string...");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PayrollDbContext] Error configuring DbContext: {ex.Message}");
                throw new InvalidOperationException("Failed to configure DbContext.", ex);
            }
            base.OnConfiguring(optionsBuilder);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            try
            {
                Console.WriteLine("[PayrollDbContext] Applying model configurations...");
                Console.WriteLine("[PayrollDbContext] Validating Employee Photo column is nvarchar(max)...");

                SeedLookupData(modelBuilder);

                modelBuilder.Entity<Company>(entity =>
                {
                    entity.ToTable("Companies");
                    entity.HasKey(e => e.CompanyID);
                    entity.Property(e => e.CompanyID).ValueGeneratedNever();
                    entity.Property(e => e.CompanyName).HasMaxLength(150).IsRequired();
                    entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                    entity.Property(e => e.Email).HasMaxLength(50);
                    entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)").IsRequired();
                    entity.Property(e => e.UpdatedAt).HasColumnType("datetime2(7)").IsRequired();
                    entity.Property(e => e.location_id).IsRequired(false);
                    entity.HasOne(e => e.Location)
                          .WithMany()
                          .HasForeignKey(e => e.location_id)
                          .OnDelete(DeleteBehavior.SetNull);
                    entity.HasIndex(e => e.CompanyID).IsUnique();
                });

                modelBuilder.Entity<Employee>(entity =>
                {
                    entity.ToTable("Employee");
                    entity.HasKey(e => e.EmployeeID);
                    entity.Property(e => e.EmployeeID).HasDefaultValueSql("NEWID()");
                    entity.Property(e => e.CompanyID).IsRequired();
                    entity.Property(e => e.DepartmentID).IsRequired();
                    entity.Property(e => e.DesignationID).IsRequired();
                    entity.Property(e => e.BranchID).IsRequired();
                    entity.Property(e => e.location_id).IsRequired();
                    entity.Property(e => e.FullName).HasMaxLength(255).IsRequired();
                    entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                    entity.Property(e => e.Email).HasMaxLength(255);
                    entity.Property(e => e.Photo).HasColumnType("nvarchar(max)").IsRequired(false);
                    entity.Property(e => e.DOB).HasColumnType("datetime2(7)").IsRequired();
                    entity.Property(e => e.HireDate).HasColumnType("datetime2(7)").IsRequired();
                    entity.Property(e => e.Recruitment).HasMaxLength(50);
                    entity.Property(e => e.RecruitmentType).HasMaxLength(100);
                    entity.Property(e => e.RecruitmentOption).HasMaxLength(50).IsRequired();
                    entity.Property(e => e.DepartmentType).HasMaxLength(50).IsRequired();
                    entity.Property(e => e.EmploymentType).HasMaxLength(50).IsRequired();
                    entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
                    entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UpdatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UserID).HasColumnType("uniqueidentifier").IsRequired(false);
                    entity.HasOne(e => e.User)
                          .WithMany()
                          .HasForeignKey(e => e.UserID)
                          .OnDelete(DeleteBehavior.SetNull);
                    entity.HasOne(e => e.Company)
                          .WithMany()
                          .HasForeignKey(e => e.CompanyID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasOne(e => e.Department)
                          .WithMany()
                          .HasForeignKey(e => e.DepartmentID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasOne(e => e.Designation)
                          .WithMany()
                          .HasForeignKey(e => e.DesignationID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasOne(e => e.Branch)
                          .WithMany()
                          .HasForeignKey(e => e.BranchID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasOne(e => e.Location)
                          .WithMany()
                          .HasForeignKey(e => e.location_id)
                          .OnDelete(DeleteBehavior.SetNull);
                    entity.HasOne(e => e.WorkArrangement)
                          .WithOne(wa => wa.Employee)
                          .HasForeignKey<WorkArrangement>(wa => wa.EmployeeID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasIndex(e => e.UserID).IsUnique();
                });

                modelBuilder.Entity<Branch>(entity =>
                {
                    entity.ToTable("Branches");
                    entity.HasKey(e => e.BranchID);
                    entity.Property(e => e.BranchID).ValueGeneratedNever();
                    entity.Property(e => e.BranchName).HasMaxLength(50).IsRequired();
                    entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                    entity.Property(e => e.Email).HasMaxLength(50);
                    entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UpdatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.CompanyID).IsRequired();
                    entity.Property(e => e.location_id).IsRequired(false);
                    entity.HasOne(e => e.Company)
                          .WithMany()
                          .HasForeignKey(e => e.CompanyID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasOne(e => e.Location)
                          .WithMany()
                          .HasForeignKey(e => e.location_id)
                          .OnDelete(DeleteBehavior.SetNull);
                    entity.HasMany(e => e.Departments)
                          .WithOne(d => d.Branch)
                          .HasForeignKey(d => d.BranchID)
                          .OnDelete(DeleteBehavior.SetNull);
                    entity.HasIndex(e => e.BranchID).IsUnique();
                });

                modelBuilder.Entity<Location>(entity =>
                {
                    entity.ToTable("Locations");
                    entity.HasKey(e => e.location_id);
                    entity.Property(e => e.location_id).HasDefaultValueSql("NEWID()");
                    entity.Property(e => e.country).HasMaxLength(50).IsRequired();
                    entity.Property(e => e.state_or_region).HasMaxLength(100);
                    entity.Property(e => e.city).HasMaxLength(100).IsRequired();
                    entity.Property(e => e.street).HasMaxLength(200);
                    entity.Property(e => e.latitude).HasColumnType("decimal(9,6)").IsRequired(false);
                    entity.Property(e => e.longitude).HasColumnType("decimal(9,6)").IsRequired(false);
                    entity.Property(e => e.created_at).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UpdatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.HasIndex(e => e.location_id).IsUnique();
                });

                modelBuilder.Entity<User>(entity =>
                {
                    entity.ToTable("User"); // Updated to singular "User"
                    entity.HasKey(e => e.UserID); // Updated to UserID
                    entity.Property(e => e.UserID).HasColumnType("uniqueidentifier").HasDefaultValueSql("NEWID()");
                    entity.Property(e => e.Username).HasMaxLength(50).HasColumnType("nvarchar(50)").IsRequired();
                    entity.Property(e => e.Email).HasMaxLength(100).HasColumnType("nvarchar(100)").IsRequired();
                    entity.Property(e => e.PasswordHash).HasColumnType("nvarchar(MAX)").IsRequired();
                    entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UpdatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.RoleID).HasColumnType("uniqueidentifier").IsRequired(false);
                    entity.HasOne(e => e.Role)
                          .WithMany(r => r.Users)
                          .HasForeignKey(e => e.RoleID)
                          .IsRequired(false)
                          .OnDelete(DeleteBehavior.SetNull);
                    entity.HasIndex(e => e.Username).IsUnique();
                    entity.HasIndex(e => e.Email).IsUnique();
                });

                modelBuilder.Entity<PasswordResetToken>(entity =>
                {
                    entity.ToTable("PasswordResetTokens");
                    entity.HasKey(e => e.Id);
                    entity.Property(e => e.Id).ValueGeneratedOnAdd();
                    entity.Property(e => e.Token).HasMaxLength(450).IsRequired();
                    entity.Property(e => e.UserId).HasColumnType("uniqueidentifier").IsRequired();
                    entity.Property(e => e.ExpiryDate).HasColumnType("datetime2(7)").IsRequired();
                    entity.Property(e => e.IsUsed).IsRequired();
                    entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.HasOne(e => e.User)
                          .WithMany()
                          .HasForeignKey(e => e.UserId)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasIndex(e => e.Token).IsUnique();
                });

                modelBuilder.Entity<Department>(entity =>
                {
                    entity.ToTable("Department");
                    entity.HasKey(e => e.DepartmentID);
                    entity.Property(e => e.DepartmentID).ValueGeneratedNever();
                    entity.Property(e => e.CompanyID).IsRequired();
                    entity.Property(e => e.BranchID).IsRequired(false);
                    entity.Property(e => e.DepartmentName).HasMaxLength(50).IsRequired();
                    entity.Property(e => e.Status).IsRequired();
                    entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UpdatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.HasOne(d => d.Company)
                          .WithMany()
                          .HasForeignKey(d => d.CompanyID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasOne(d => d.Branch)
                          .WithMany(b => b.Departments)
                          .HasForeignKey(d => d.BranchID)
                          .OnDelete(DeleteBehavior.SetNull);
                    entity.HasIndex(e => e.DepartmentID).IsUnique();
                });

                modelBuilder.Entity<Designation>(entity =>
                {
                    entity.ToTable("Designation");
                    entity.HasKey(e => e.DesignationID);
                    entity.Property(e => e.DesignationID).ValueGeneratedNever();
                    entity.Property(e => e.DepartmentID).IsRequired();
                    entity.Property(e => e.DesignationName).HasMaxLength(50).IsRequired();
                    entity.Property(e => e.Status).IsRequired();
                    entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UpdatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.HasOne(d => d.DepartmentNavigation)
                          .WithMany()
                          .HasForeignKey(d => d.DepartmentID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasIndex(e => e.DesignationID).IsUnique();
                });

                modelBuilder.Entity<WorkArrangement>(entity =>
                {
                    entity.ToTable("WorkArrangement");
                    entity.HasKey(wa => wa.WorkArrangementID);
                    entity.Property(wa => wa.WorkArrangementID).HasDefaultValueSql("NEWID()");
                    entity.Property(wa => wa.EmployeeID).IsRequired();
                    entity.Property(wa => wa.ArrangementTypeID).IsRequired();
                    entity.Property(wa => wa.PensionPlanID).IsRequired();
                    entity.Property(wa => wa.PensionRate).HasColumnType("decimal(5,2)").IsRequired(false);
                    entity.Property(wa => wa.CostSharingTypeID).IsRequired();
                    entity.Property(wa => wa.CostSharingValue).HasColumnType("decimal(18,2)").IsRequired(false);
                    entity.Property(wa => wa.TaxStatusID).IsRequired();
                    entity.Property(wa => wa.PartialTaxRate).HasColumnType("decimal(5,2)").IsRequired(false);
                    entity.Property(wa => wa.StartDate).HasColumnType("datetime2(7)").IsRequired();
                    entity.Property(wa => wa.EndDate).HasColumnType("datetime2(7)").IsRequired(false);
                    entity.Property(wa => wa.TerminationReasonID).IsRequired(false);
                    entity.Property(wa => wa.CreatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(wa => wa.UpdatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.HasOne(wa => wa.Employee)
                          .WithOne(e => e.WorkArrangement)
                          .HasForeignKey<WorkArrangement>(wa => wa.EmployeeID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasOne(wa => wa.ArrangementType)
                          .WithMany()
                          .HasForeignKey(wa => wa.ArrangementTypeID)
                          .OnDelete(DeleteBehavior.Restrict);
                    entity.HasOne(wa => wa.PensionPlan)
                          .WithMany()
                          .HasForeignKey(wa => wa.PensionPlanID)
                          .OnDelete(DeleteBehavior.Restrict);
                    entity.HasOne(wa => wa.CostSharingType)
                          .WithMany()
                          .HasForeignKey(wa => wa.CostSharingTypeID)
                          .OnDelete(DeleteBehavior.Restrict);
                    entity.HasOne(wa => wa.TaxStatus)
                          .WithMany()
                          .HasForeignKey(wa => wa.TaxStatusID)
                          .OnDelete(DeleteBehavior.Restrict);
                    entity.HasOne(wa => wa.TerminationReason)
                          .WithMany()
                          .HasForeignKey(wa => wa.TerminationReasonID)
                          .OnDelete(DeleteBehavior.SetNull);
                    entity.HasIndex(wa => wa.EmployeeID).IsUnique();
                });

                modelBuilder.Entity<LeaveType>(entity =>
                {
                    entity.ToTable("LeaveType");
                    entity.HasKey(e => e.LeaveTypeID);
                    entity.Property(e => e.LeaveTypeID).ValueGeneratedOnAdd();
                    entity.Property(e => e.Name).HasMaxLength(50).IsRequired();
                    entity.Property(e => e.Description).HasColumnType("nvarchar(max)");
                    entity.Property(e => e.LeaveWithPay).IsRequired(false);
                    entity.Property(e => e.MedicalApproval).IsRequired(false);
                    entity.Property(e => e.HRApprovalRequired).IsRequired(false);
                    entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UpdatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.HasIndex(e => e.Name).IsUnique();
                });

                modelBuilder.Entity<Leave>(entity =>
                {
                    entity.ToTable("Leave");
                    entity.HasKey(e => e.LeaveID);
                    entity.Property(e => e.LeaveID).ValueGeneratedOnAdd();
                    entity.Property(e => e.EmployeeID).IsRequired();
                    entity.Property(e => e.LeaveTypeID).IsRequired();
                    entity.Property(e => e.StartDate).HasColumnType("datetime2(7)").IsRequired();
                    entity.Property(e => e.EndDate).HasColumnType("datetime2(7)").IsRequired();
                    entity.Property(e => e.LeaveDescription).HasColumnType("nvarchar(max)");
                    entity.Property(e => e.MedicalDocument).HasColumnType("nvarchar(max)");
                    entity.Property(e => e.RejectionReason).HasColumnType("nvarchar(max)");
                    entity.Property(e => e.LeaveOfficesFiled).IsRequired(false);
                    entity.Property(e => e.AnnualLeaveDate).HasColumnType("datetime2(7)").IsRequired(false);
                    entity.Property(e => e.ApprovedBy).IsRequired(false);
                    entity.Property(e => e.Status).HasColumnType("int").IsRequired().HasDefaultValue(0);
                    entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UpdatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.HasOne(e => e.Employee)
                          .WithMany()
                          .HasForeignKey(e => e.EmployeeID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasOne(e => e.LeaveType)
                          .WithMany()
                          .HasForeignKey(e => e.LeaveTypeID)
                          .OnDelete(DeleteBehavior.Cascade);
                    entity.HasIndex(e => new { e.EmployeeID, e.StartDate }).IsUnique();
                });

                modelBuilder.Entity<Period>(entity =>
                {
                    entity.ToTable("Periods");
                    entity.HasKey(e => e.PeriodID);
                    entity.Property(e => e.PeriodID).ValueGeneratedNever();
                    entity.Property(e => e.PeriodName).HasMaxLength(50).IsRequired();
                    entity.Property(e => e.PeriodSequence).IsRequired(false);
                    entity.Property(e => e.StartDate).HasColumnType("datetime2(7)").IsRequired();
                    entity.Property(e => e.EndDate).HasColumnType("datetime2(7)").IsRequired();
                    entity.Property(e => e.CalendarType).HasMaxLength(20).IsRequired().HasDefaultValue("Gregorian");
                    entity.Property(e => e.CutoffDay).IsRequired();
                    entity.Property(e => e.Status).HasConversion<int>().IsRequired().HasDefaultValue(0);
                    entity.Property(e => e.CreatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UpdatedAt).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.HasIndex(e => e.PeriodName).IsUnique();
                });

                modelBuilder.Entity<ArrangementType>(entity =>
                {
                    entity.ToTable("ArrangementType");
                    entity.HasKey(e => e.TypeID);
                    entity.Property(e => e.TypeID).ValueGeneratedOnAdd();
                    entity.Property(e => e.Description).HasMaxLength(100).IsRequired();
                    entity.HasIndex(e => e.TypeID).IsUnique();
                });

                modelBuilder.Entity<PensionPlan>(entity =>
                {
                    entity.ToTable("PensionPlan");
                    entity.HasKey(e => e.PlanID);
                    entity.Property(e => e.PlanID).ValueGeneratedOnAdd();
                    entity.Property(e => e.Description).HasMaxLength(100).IsRequired();
                    entity.HasIndex(e => e.PlanID).IsUnique();
                });

                modelBuilder.Entity<CostSharingType>(entity =>
                {
                    entity.ToTable("CostSharingType");
                    entity.HasKey(e => e.TypeID);
                    entity.Property(e => e.TypeID).ValueGeneratedOnAdd();
                    entity.Property(e => e.Description).HasMaxLength(100).IsRequired();
                    entity.HasIndex(e => e.TypeID).IsUnique();
                });

                modelBuilder.Entity<TaxStatus>(entity =>
                {
                    entity.ToTable("TaxStatus");
                    entity.HasKey(e => e.StatusID);
                    entity.Property(e => e.StatusID).ValueGeneratedOnAdd();
                    entity.Property(e => e.Description).HasMaxLength(100).IsRequired();
                    entity.HasIndex(e => e.StatusID).IsUnique();
                });

                modelBuilder.Entity<TerminationReason>(entity =>
                {
                    entity.ToTable("TerminationReason");
                    entity.HasKey(e => e.ReasonID);
                    entity.Property(e => e.ReasonID).ValueGeneratedOnAdd();
                    entity.Property(e => e.Description).HasMaxLength(100).IsRequired();
                    entity.HasIndex(e => e.ReasonID).IsUnique();
                });

                modelBuilder.Entity<Attendance>(entity =>
                {
                    entity.ToTable("Attendance");
                    entity.HasKey(a => a.AttendanceID);
                    entity.Property(a => a.AttendanceID).HasDefaultValueSql("NEWID()");
                    entity.Property(a => a.EmployeeID).IsRequired();
                    entity.Property(a => a.PeriodID).IsRequired();
                    entity.Property(a => a.InTime).HasColumnType("time(7)").IsRequired();
                    entity.Property(a => a.OutTime).HasColumnType("time(7)").IsRequired(false);
                    entity.Property(a => a.Status).IsRequired().HasDefaultValue(0).HasComment("0=Absent, 1=Present, 2=Late, 3=On Leave, 4=Half Day, 5=Early Leave");
                    entity.Property(a => a.Date).HasColumnType("date").IsRequired();
                    entity.Property(a => a.GPS_Latitude).HasColumnType("decimal(10,8)").IsRequired(false);
                    entity.Property(a => a.GPS_Longitude).HasColumnType("decimal(11,8)").IsRequired(false);
                    entity.Property(a => a.PhotoURL).HasColumnType("nvarchar(max)").IsRequired(false);
                    entity.Property(a => a.CreatedAt).HasColumnType("datetime").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(a => a.UpdatedAt).HasColumnType("datetime").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.HasOne(a => a.Employee)
                          .WithMany()
                          .HasForeignKey(a => a.EmployeeID)
                          .OnDelete(DeleteBehavior.Restrict);
                    entity.HasOne(a => a.Period)
                          .WithMany()
                          .HasForeignKey(a => a.PeriodID)
                          .OnDelete(DeleteBehavior.Restrict);
                    entity.HasIndex(a => new { a.EmployeeID, a.Date }).IsUnique();
                });

                modelBuilder.Entity<Role>(entity =>
                {
                    entity.ToTable("Role");
                    entity.HasKey(e => e.RoleID);
                    entity.Property(e => e.RoleID).HasColumnType("uniqueidentifier").HasDefaultValueSql("NEWID()");
                    entity.Property(e => e.Status).IsRequired();
                    entity.Property(e => e.CreatedDate).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.UpdatedDate).HasColumnType("datetime2(7)").IsRequired().HasDefaultValueSql("GETDATE()");
                    entity.Property(e => e.RoleName).HasMaxLength(50).IsRequired();
                    entity.HasMany(r => r.Users)
                          .WithOne(u => u.Role)
                          .HasForeignKey(u => u.RoleID)
                          .IsRequired(false)
                          .OnDelete(DeleteBehavior.SetNull);
                    entity.HasIndex(e => e.RoleID).IsUnique();
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PayrollDbContext] Error in OnModelCreating: {ex.Message}");
                throw new InvalidOperationException("Failed to apply model configurations.", ex);
            }
        }

        private void SeedLookupData(ModelBuilder modelBuilder)
        {
            try
            {
                Console.WriteLine("[PayrollDbContext] Seeding lookup data...");

                modelBuilder.Entity<ArrangementType>().HasData(
                    new ArrangementType { TypeID = 1, Description = "Full-Time" },
                    new ArrangementType { TypeID = 2, Description = "Part-Time" },
                    new ArrangementType { TypeID = 3, Description = "Contract" },
                    new ArrangementType { TypeID = 4, Description = "Temporary" },
                    new ArrangementType { TypeID = 5, Description = "Internship" },
                    new ArrangementType { TypeID = 6, Description = "Remote" },
                    new ArrangementType { TypeID = 7, Description = "Hybrid" }
                );

                modelBuilder.Entity<PensionPlan>().HasData(
                    new PensionPlan { PlanID = 1, Description = "No Pension" },
                    new PensionPlan { PlanID = 2, Description = "Defined Benefit" },
                    new PensionPlan { PlanID = 3, Description = "Defined Contribution" },
                    new PensionPlan { PlanID = 4, Description = "401(k)" },
                    new PensionPlan { PlanID = 5, Description = "IRA" },
                    new PensionPlan { PlanID = 6, Description = "Roth IRA" }
                );

                modelBuilder.Entity<CostSharingType>().HasData(
                    new CostSharingType { TypeID = 1, Description = "No Cost Sharing" },
                    new CostSharingType { TypeID = 2, Description = "Percentage Based" },
                    new CostSharingType { TypeID = 3, Description = "Fixed Amount" },
                    new CostSharingType { TypeID = 4, Description = "Tiered Structure" }
                );

                modelBuilder.Entity<TaxStatus>().HasData(
                    new TaxStatus { StatusID = 1, Description = "Exempt" },
                    new TaxStatus { StatusID = 2, Description = "Non-Exempt" },
                    new TaxStatus { StatusID = 3, Description = "Partial" },
                    new TaxStatus { StatusID = 4, Description = "Student" },
                    new TaxStatus { StatusID = 5, Description = "Retired" }
                );

                modelBuilder.Entity<TerminationReason>().HasData(
                    new TerminationReason { ReasonID = 1, Description = "Resignation" },
                    new TerminationReason { ReasonID = 2, Description = "Termination" },
                    new TerminationReason { ReasonID = 3, Description = "Retirement" },
                    new TerminationReason { ReasonID = 4, Description = "End of Contract" },
                    new TerminationReason { ReasonID = 5, Description = "Layoff" },
                    new TerminationReason { ReasonID = 6, Description = "Death" },
                    new TerminationReason { ReasonID = 7, Description = "Disability" }
                );

                modelBuilder.Entity<Role>().HasData(
                    new Role { RoleID = Guid.Parse("3BBB0200-87A6-4CE7-BC99-C2D7055627F5"), RoleName = "Admin", Status = 1, CreatedDate = DateTime.UtcNow, UpdatedDate = DateTime.UtcNow },
                    new Role { RoleID = Guid.Parse("1E09BBAE-44EE-469F-BCF4-15B22BBD4F83"), RoleName = "Employee", Status = 1, CreatedDate = DateTime.UtcNow, UpdatedDate = DateTime.UtcNow },
                    new Role { RoleID = Guid.Parse("33333333-3333-3333-3333-333333333333"), RoleName = "Manager", Status = 1, CreatedDate = DateTime.UtcNow, UpdatedDate = DateTime.UtcNow }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PayrollDbContext] Error seeding data: {ex.Message}");
                throw new InvalidOperationException("Failed to seed lookup data.", ex);
            }
        }

        /// <summary>
        /// Retrieves the active work arrangement for a given employee.
        /// </summary>
        /// <param name="employeeId">The unique identifier of the employee.</param>
        /// <param name="cancellationToken">A token to cancel the operation.</param>
        /// <returns>The active work arrangement, or null if none exists.</returns>
        public async Task<WorkArrangement?> GetActiveWorkArrangementAsync(Guid employeeId, CancellationToken cancellationToken = default)
        {
            try
            {
                return await WorkArrangements
                    .Include(wa => wa.ArrangementType)
                    .Include(wa => wa.PensionPlan)
                    .Include(wa => wa.CostSharingType)
                    .Include(wa => wa.TaxStatus)
                    .Include(wa => wa.TerminationReason)
                    .FirstOrDefaultAsync(wa => wa.EmployeeID == employeeId && wa.EndDate == null, cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PayrollDbContext] Error retrieving active work arrangement for employee {employeeId}: {ex.Message}");
                throw new InvalidOperationException("Failed to retrieve active work arrangement.", ex);
            }
        }

        /// <summary>
        /// Retrieves the work arrangement history for a given employee.
        /// </summary>
        /// <param name="employeeId">The unique identifier of the employee.</param>
        /// <param name="cancellationToken">A token to cancel the operation.</param>
        /// <returns>A list of past work arrangements, ordered by start date descending.</returns>
        public async Task<IEnumerable<WorkArrangement>> GetWorkArrangementHistoryAsync(Guid employeeId, CancellationToken cancellationToken = default)
        {
            try
            {
                return await WorkArrangements
                    .Include(wa => wa.ArrangementType)
                    .Include(wa => wa.PensionPlan)
                    .Include(wa => wa.CostSharingType)
                    .Include(wa => wa.TaxStatus)
                    .Include(wa => wa.TerminationReason)
                    .Where(wa => wa.EmployeeID == employeeId)
                    .OrderByDescending(wa => wa.StartDate)
                    .ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PayrollDbContext] Error retrieving work arrangement history for employee {employeeId}: {ex.Message}");
                throw new InvalidOperationException("Failed to retrieve work arrangement history.", ex);
            }
        }

        /// <summary>
        /// Retrieves all active work arrangements across employees.
        /// </summary>
        /// <param name="cancellationToken">A token to cancel the operation.</param>
        /// <returns>A list of active work arrangements, ordered by employee name.</returns>
        public async Task<IEnumerable<WorkArrangement>> GetActiveWorkArrangementsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                return await WorkArrangements
                    .Include(wa => wa.Employee)
                    .Include(wa => wa.ArrangementType)
                    .Include(wa => wa.PensionPlan)
                    .Include(wa => wa.CostSharingType)
                    .Include(wa => wa.TaxStatus)
                    .Where(wa => wa.EndDate == null)
                    .OrderBy(wa => wa.Employee != null ? wa.Employee.FullName : string.Empty)
                    .ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PayrollDbContext] Error retrieving active work arrangements: {ex.Message}");
                throw new InvalidOperationException("Failed to retrieve active work arrangements.", ex);
            }
        }

        /// <summary>
        /// Checks if an employee has an active work arrangement.
        /// </summary>
        /// <param name="employeeId">The unique identifier of the employee.</param>
        /// <param name="cancellationToken">A token to cancel the operation.</param>
        /// <returns>True if an active work arrangement exists, false otherwise.</returns>
        public async Task<bool> HasActiveWorkArrangementAsync(Guid employeeId, CancellationToken cancellationToken = default)
        {
            try
            {
                return await WorkArrangements
                    .AnyAsync(wa => wa.EmployeeID == employeeId && wa.EndDate == null, cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PayrollDbContext] Error checking active work arrangement for employee {employeeId}: {ex.Message}");
                throw new InvalidOperationException("Failed to check active work arrangement.", ex);
            }
        }
    }
}