namespace payroll.web.Models
{
    public class LeaveType
    {
        public Guid LeaveTypeID { get; set; }
        public required string Name { get; set; } // Mark as required to fix non-nullable warning
        public string? Description { get; set; }
        public bool? LeaveWithPay { get; set; } // TRUE if the leave is with pay
        public bool? MedicalApproval { get; set; } // TRUE if medical approval required
        public bool? HRApprovalRequired { get; set; } // TRUE if HR approval required
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}