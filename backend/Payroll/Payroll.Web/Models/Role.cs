using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace payroll.web.Models
{
    public class Role
    {
        [Key]
        public Guid RoleID { get; set; } = Guid.NewGuid();

        [Required]
        public int Status { get; set; }

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        [Required]
        [StringLength(50)]
        public string RoleName { get; set; } = null!;

        // Optional: navigation property for users in this role
        public ICollection<User>? Users { get; set; }
    }
}