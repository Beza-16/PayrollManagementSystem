using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace payroll.web.Models
{
    public class Employee
    {
        [Key]
        public Guid EmployeeID { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CompanyID { get; set; }

        [Required]
        public Guid DepartmentID { get; set; }

        [Required]
        public Guid DesignationID { get; set; }

        [Required]
        public Guid BranchID { get; set; }

        [Required]
        public Guid location_id { get; set; }

        [Required]
        [StringLength(255, MinimumLength = 2)]
        public string FullName { get; set; } = null!;

        [StringLength(20)]
        [Phone]
        public string? PhoneNumber { get; set; }

        [StringLength(255)]
        [EmailAddress]
        public string? Email { get; set; }

        public string? Photo { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public DateTime DOB { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public DateTime HireDate { get; set; }

        [StringLength(50)]
        public string? Recruitment { get; set; }

        [StringLength(100)]
        public string? RecruitmentType { get; set; }

        [Required]
        [StringLength(50)]
        public string RecruitmentOption { get; set; } = "Full-Time";

        [Required]
        [StringLength(50)]
        public string DepartmentType { get; set; } = "Core";

        [Required]
        [StringLength(50)]
        public string EmploymentType { get; set; } = "Permanent";

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Active";

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Guid? UserID { get; set; } // Foreign key to User.Id, nullable

        [ForeignKey("UserID")]
        public User? User { get; set; }

        [ForeignKey("CompanyID")]
        public Company? Company { get; set; }

        [ForeignKey("DepartmentID")]
        public Department? Department { get; set; }

        [ForeignKey("DesignationID")]
        public Designation? Designation { get; set; }

        [ForeignKey("BranchID")]
        public Branch? Branch { get; set; }

        [ForeignKey("location_id")]
        public Location? Location { get; set; }

        public WorkArrangement? WorkArrangement { get; set; }
    }
}