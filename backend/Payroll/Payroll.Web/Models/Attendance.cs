using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace payroll.web.Models
{
    public class Attendance
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid AttendanceID { get; set; }

        [Required]
        public Guid EmployeeID { get; set; }

        [Required]
        public Guid PeriodID { get; set; }

        [Required]
        public TimeSpan InTime { get; set; }

        public TimeSpan? OutTime { get; set; }

        [Required]
        [Range(0, 5, ErrorMessage = "Status must be between 0 and 5.")]
        public int Status { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Column(TypeName = "decimal(10,8)")]
        public decimal? GPS_Latitude { get; set; }

        [Column(TypeName = "decimal(11,8)")]
        public decimal? GPS_Longitude { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? PhotoURL { get; set; }

        [Required]
        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; }

        [Required]
        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; }

        public Employee? Employee { get; set; }
        public Period? Period { get; set; }
    }
}