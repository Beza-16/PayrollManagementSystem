//using Microsoft.AspNetCore.Mvc;
//using payroll.web.Data;
//using payroll.web.Models;
//using Microsoft.EntityFrameworkCore;
//using System;
//using System.Linq;

//namespace payroll.web.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class RoleAssignmentController : ControllerBase
//    {
//        private readonly PayrollDbContext _context;

//        public RoleAssignmentController(PayrollDbContext context)
//        {
//            _context = context ?? throw new ArgumentNullException(nameof(context));
//        }

//        [HttpGet]
//        public IActionResult GetRoleAssignments()
//        {
//            var assignments = _context.RoleAssignments
//                .Include(ra => ra.User)
//                .Include(ra => ra.Role)
//                .AsEnumerable()
//                .Select(ra => new
//                {
//                    RoleAssignmentID = ra.RoleAssignmentID,
//                    UserName = ra.User != null ? ra.User.Username : "Unknown", // User-friendly name
//                    UserID = ra.UserID, // Keep ID for backend reference
//                    RoleName = ra.Role != null ? ra.Role.RoleID.ToString() : "Unknown", // Placeholder since RoleName is not in model
//                    RoleID = ra.RoleID, // Keep ID for backend reference
//                    Status = ra.Status == 1 ? "Active" : "Inactive",
//                    CreatedDate = ra.CreatedDate,
//                    UpdatedDate = ra.UpdatedDate,
//                    Action = new { }
//                }).ToList();
//            return Ok(assignments);
//        }

//        [HttpPost]
//        public IActionResult AssignRole([FromBody] RoleAssignment assignment)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            assignment.CreatedDate = DateTime.UtcNow;
//            assignment.UpdatedDate = DateTime.UtcNow;
//            _context.RoleAssignments.Add(assignment);
//            _context.SaveChanges();
//            return CreatedAtAction(nameof(GetRoleAssignments), new { id = assignment.RoleAssignmentID }, assignment);
//        }

//        [HttpPut("{id}")]
//        public IActionResult UpdateRoleAssignment(Guid id, [FromBody] RoleAssignment assignment)
//        {
//            if (id != assignment.RoleAssignmentID || !ModelState.IsValid)
//                return BadRequest();

//            var existingAssignment = _context.RoleAssignments.Find(id);
//            if (existingAssignment == null)
//                return NotFound();

//            existingAssignment.UserID = assignment.UserID;
//            existingAssignment.RoleID = assignment.RoleID;
//            existingAssignment.Status = assignment.Status;
//            existingAssignment.UpdatedDate = DateTime.UtcNow;
//            _context.SaveChanges();
//            return NoContent();
//        }

//        [HttpDelete("{id}")]
//        public IActionResult DeleteRoleAssignment(Guid id)
//        {
//            var assignment = _context.RoleAssignments.Find(id);
//            if (assignment == null)
//                return NotFound();

//            _context.RoleAssignments.Remove(assignment);
//            _context.SaveChanges();
//            //return NoContent();
//        }
//    }
///}