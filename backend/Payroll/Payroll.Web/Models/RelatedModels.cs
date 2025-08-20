using System;
using System.ComponentModel.DataAnnotations;

namespace payroll.web.Models
{
    public class ArrangementType
    {
        [Key]
        public int TypeID { get; set; }

        [Required]
        [StringLength(100)]
        public string Description { get; set; } = null!;
    }

    public class PensionPlan
    {
        [Key]
        public int PlanID { get; set; }

        [Required]
        [StringLength(100)]
        public string Description { get; set; } = null!;
    }

    public class CostSharingType
    {
        [Key]
        public int TypeID { get; set; }

        [Required]
        [StringLength(100)]
        public string Description { get; set; } = null!;
    }

    public class TaxStatus
    {
        [Key]
        public int StatusID { get; set; }

        [Required]
        [StringLength(100)]
        public string Description { get; set; } = null!;
    }

    public class TerminationReason
    {
        [Key]
        public int ReasonID { get; set; }

        [Required]
        [StringLength(100)]
        public string Description { get; set; } = null!;
    }
}