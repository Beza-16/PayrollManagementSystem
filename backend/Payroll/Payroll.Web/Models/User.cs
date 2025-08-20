using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace payroll.web.Models
{
    public class User
    {
        [Key]
        public Guid UserID { get; set; } = Guid.NewGuid(); // Primary key as Guid, renamed to UserID

        [Required]
        [StringLength(50, ErrorMessage = "Username cannot exceed 50 characters.")]
        public string Username { get; set; } = null!;

        [Required]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public string Email { get; set; } = null!;

        [Required]
        public string PasswordHash { get; set; } = null!; // nvarchar(MAX) in schema, no length restriction

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Guid? RoleID { get; set; } // Nullable foreign key to Role

        [ForeignKey("RoleID")]
        public Role? Role { get; set; }
    }
}