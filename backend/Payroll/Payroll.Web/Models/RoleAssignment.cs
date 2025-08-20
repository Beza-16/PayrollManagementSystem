//using System;
//using System.ComponentModel.DataAnnotations;
//using System.ComponentModel.DataAnnotations.Schema;

//namespace payroll.web.Models
//{
//    public class RoleAssignment
//    {
//        [Key]
//        [Column("RoleAssignmentID")]
//        public Guid RoleAssignmentID { get; set; } // No ValueGeneratedNever, handled by DB

//        [Required]
//        [Column("UserID")]
//        public Guid UserID { get; set; }

//        [Required]
//        [Column("RoleID")]
//        public Guid RoleID { get; set; }

//        [Required]
//        [Column("Status")]
//        public int Status { get; set; }

//        [Required]
//        [Column("CreatedDate")]
//        public DateTime CreatedDate { get; set; } = DateTime.UtcNow; // Default

//        [Required]
//        [Column("UpdatedDate")]
//        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow; // Default

//        [ForeignKey("UserID")]
//        public User? User { get; set; } // Nullable

//        [ForeignKey("RoleID")]
//        public Role? Role { get; set; } // Nullable
//    }
//}