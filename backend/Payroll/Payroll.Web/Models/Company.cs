using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace payroll.web.Models
{
    public class Company
    {
        [Key]
        public Guid CompanyID { get; set; }

        [Required]
        [MaxLength(150)]
        public string CompanyName { get; set; } = null!;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(50)]
        public string? Email { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        public Guid? location_id { get; set; }

        [ForeignKey("location_id")]
        public Location? Location { get; set; }
    }
}
