using System.ComponentModel.DataAnnotations;

namespace payroll.web.Models
{
    public class Address
    {
        [Key]
        public Guid AddressID { get; set; }

        [Required]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Country { get; set; } = string.Empty;
    }
}