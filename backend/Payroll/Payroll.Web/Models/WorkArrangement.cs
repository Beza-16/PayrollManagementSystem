using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using payroll.web.Models; // Added for ArrangementType, PensionPlan, etc.

namespace payroll.web.Models
{
    public class WorkArrangement
    {
        [Key]
        public Guid WorkArrangementID { get; set; }

        [Required]
        public Guid EmployeeID { get; set; }

        [Required]
        public int ArrangementTypeID { get; set; }

        [Required]
        public int PensionPlanID { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? PensionRate { get; set; }

        [Required]
        public int CostSharingTypeID { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? CostSharingValue { get; set; }

        [Required]
        public int TaxStatusID { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? PartialTaxRate { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public int? TerminationReasonID { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public Employee Employee { get; set; } = null!;

        public ArrangementType ArrangementType { get; set; } = null!;

        public PensionPlan PensionPlan { get; set; } = null!;

        public CostSharingType CostSharingType { get; set; } = null!;

        public TaxStatus TaxStatus { get; set; } = null!;

        public TerminationReason? TerminationReason { get; set; }
    }
}