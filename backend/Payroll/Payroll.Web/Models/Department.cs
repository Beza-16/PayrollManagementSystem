using System;
using System.ComponentModel.DataAnnotations;
using payroll.web.Models;

namespace payroll.web.Models
{
    public class Department
    {
        [Key]
        public Guid DepartmentID { get; set; }

        [Required]
        public Guid CompanyID { get; set; }

        public Guid? BranchID { get; set; }

        [Required]
        [MaxLength(50)]
        public string DepartmentName { get; set; } = string.Empty;

        [Required]
        [Range(0, 1, ErrorMessage = "Status must be 0 or 1.")]
        public int Status { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        public Company? Company { get; set; }
        public Branch? Branch { get; set; }

        public Department()
        {
            DepartmentID = Guid.NewGuid();
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}