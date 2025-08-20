using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace payroll.web.Models
{
    public class Location
    {
        [Key]
        public Guid location_id { get; set; }

        [Required]
        [MaxLength(50)]
        public string country { get; set; } = null!;

        [MaxLength(100)]
        public string? state_or_region { get; set; }

        [Required]
        [MaxLength(100)]
        public string city { get; set; } = null!;

        [MaxLength(200)]
        public string? street { get; set; }

        [Column(TypeName = "decimal(9,6)")]
        public decimal? latitude { get; set; }

        [Column(TypeName = "decimal(9,6)")]
        public decimal? longitude { get; set; }

        [Required]
        public DateTime created_at { get; set; } // Keeping as is per your request

        [Required]
        public DateTime UpdatedAt { get; set; } // Changed from updated_at
    }
}