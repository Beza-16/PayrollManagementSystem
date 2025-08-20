namespace payroll.web.Models
{
    public class Leave
    {
        public Guid LeaveID { get; set; }
        public Guid EmployeeID { get; set; } // Foreign key linking to the Employee Table
        public Guid LeaveTypeID { get; set; } // Foreign key linking to the LeaveType Table
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? LeaveDescription { get; set; }
        public int Status { get; set; } // INT(2): 0=Pending, 1=Approved, 2=Denied
        public string? RejectionReason { get; set; } // Reason for denial
        public string? MedicalDocument { get; set; } // File path/URL for medical certificate
        public bool? LeaveOfficesFiled { get; set; }
        public DateTime? AnnualLeaveDate { get; set; }
        public Guid? ApprovedBy { get; set; } // Admin user ID who approved/denied
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Employee? Employee { get; set; } // Make nullable to fix warning
        public LeaveType? LeaveType { get; set; } // Make nullable to fix warning
    }
}