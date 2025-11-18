import sql from "@/app/api/utils/sql";

// Create a new skin analysis
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      patient_id, 
      image_url, 
      skin_condition, 
      severity, 
      analysis_result, 
      ayurvedic_treatments, 
      recommended_foods, 
      foods_to_avoid, 
      lifestyle_recommendations 
    } = body;

    if (!patient_id || !image_url) {
      return Response.json({ error: "Patient ID and image URL are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO skin_analyses (
        patient_id, 
        image_url, 
        skin_condition, 
        severity, 
        analysis_result, 
        ayurvedic_treatments, 
        recommended_foods, 
        foods_to_avoid, 
        lifestyle_recommendations
      )
      VALUES (
        ${patient_id}, 
        ${image_url}, 
        ${skin_condition || null}, 
        ${severity || null}, 
        ${analysis_result || null}, 
        ${ayurvedic_treatments || null}, 
        ${recommended_foods || null}, 
        ${foods_to_avoid || null}, 
        ${lifestyle_recommendations || null}
      )
      RETURNING *
    `;

    return Response.json({ analysis: result[0] });
  } catch (error) {
    console.error("Error creating skin analysis:", error);
    return Response.json({ error: "Failed to create skin analysis" }, { status: 500 });
  }
}

// Get skin analyses for a patient
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get('patient_id');

    if (!patient_id) {
      return Response.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const analyses = await sql`
      SELECT sa.*, p.name as patient_name
      FROM skin_analyses sa
      JOIN patients p ON sa.patient_id = p.id
      WHERE sa.patient_id = ${patient_id}
      ORDER BY sa.created_at DESC
    `;

    return Response.json({ analyses });
  } catch (error) {
    console.error("Error fetching skin analyses:", error);
    return Response.json({ error: "Failed to fetch skin analyses" }, { status: 500 });
  }
}