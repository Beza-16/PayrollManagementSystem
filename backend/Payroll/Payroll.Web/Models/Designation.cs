using System.ComponentModel.DataAnnotations;

namespace payroll.web.Models
{
    public class Designation
    {
        [Key]
        public Guid DesignationID { get; set; }

        [Required]
        public Guid DepartmentID { get; set; }

        [Required]
        [MaxLength(50)]
        public string DesignationName { get; set; } = string.Empty;

        [Required]
        [Range(0, 1, ErrorMessage = "Status must be 0 or 1.")]
        public int Status { get; set; } = 1; // Default to 1 (Active)

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        // Navigation property
        public Department? DepartmentNavigation { get; set; }

        public Designation()
        {
            DesignationID = Guid.NewGuid();
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
            Status = 1; // Default to Active
        }
    }
}