using System.ComponentModel.DataAnnotations;

public class LocationDto
{
    public int? Id { get; set; } // Optional ID for updates

    [Required]
    public string LocationType { get; set; } = string.Empty; // Default to empty string

    [Required]
    public string ReferenceID { get; set; } = string.Empty; // Default to empty string

    [Required]
    public string Country { get; set; } = string.Empty; // Default to empty string

    [Required]
    public string City { get; set; } = string.Empty; // Default to empty string

    public string? State { get; set; } // Nullable
    public string? Region { get; set; } // Nullable
    public string? Street { get; set; } // Nullable
    public double? Latitude { get; set; } // Nullable
    public double? Longitude { get; set; } // Nullable
}