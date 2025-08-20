using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace payroll.web.Models
{
    public class Branch
    {
        [Key]
        public Guid BranchID { get; set; }

        [Required]
        [MaxLength(50)]
        public string BranchName { get; set; } = null!;

        [Required]
        public Guid CompanyID { get; set; }

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(50)]
        public string? Email { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        public Guid? location_id { get; set; } // Foreign key to Location

        [ForeignKey("location_id")]
        public Location? Location { get; set; }

        [ForeignKey("CompanyID")]
        public Company? Company { get; set; }

        public ICollection<Department>? Departments { get; set; }
    }
}