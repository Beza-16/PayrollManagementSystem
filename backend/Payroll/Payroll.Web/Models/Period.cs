using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace payroll.web.Models
{
    public class Period
    {
        [Key]
        public Guid PeriodID { get; set; }

        [Required]
        [MaxLength(50)]
        public string PeriodName { get; set; } = string.Empty;

        public int? PeriodSequence { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [MaxLength(20)]
        public string CalendarType { get; set; } = "Gregorian";

        [Required]
        public int CutoffDay { get; set; }

        [Required]
        public int Status { get; set; } // Changed to int, maps to enum values (0, 1, 2)

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }
    }
}