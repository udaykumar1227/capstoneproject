import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Upload, User, Sparkles } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useUpload from "@/utils/useUpload";

export default function SkinAnalysisScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [upload, { loading: uploadLoading }] = useUpload();

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch patients for selection
  const { data: patientsData } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await fetch("/api/patients");
      if (!response.ok) throw new Error("Failed to fetch patients");
      return response.json();
    },
  });

  const patients = patientsData?.patients || [];

  // Save analysis mutation
  const saveAnalysisMutation = useMutation({
    mutationFn: async (analysisData) => {
      const response = await fetch("/api/skin-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysisData),
      });
      if (!response.ok) throw new Error("Failed to save analysis");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skin-analyses"] });
      Alert.alert("Success", "Analysis saved successfully!");
      // Reset form
      setSelectedImage(null);
      setSelectedPatient(null);
      setAnalysisResult(null);
    },
    onError: () => {
      Alert.alert("Error", "Failed to save analysis");
    },
  });

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setAnalysisResult(null); // Reset previous analysis
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera permission is required to take photos",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setAnalysisResult(null); // Reset previous analysis
    }
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Upload image first
      const { url: imageUrl, error: uploadError } = await upload({
        reactNativeAsset: selectedImage,
      });

      if (uploadError) {
        throw new Error(uploadError);
      }

      // Convert image to base64 for GPT Vision
      const response = await fetch(selectedImage.uri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Analyze with GPT Vision
      const analysisResponse = await fetch("/integrations/gpt-vision/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are an experienced Ayurvedic practitioner and dermatology consultant providing educational information about skin conditions and traditional Ayurvedic approaches. Please analyze this skin image for educational purposes and provide detailed information.

**IMPORTANT**: This is for educational and informational purposes only. Always recommend consulting with qualified healthcare professionals for proper diagnosis and treatment.

Please provide a comprehensive analysis following this structure:

**1. Skin Condition Identification**
- Describe what you observe in the image (color, texture, lesions, etc.)
- Suggest possible skin conditions based on visual characteristics
- Note any patterns or distribution you see

**2. Severity Assessment**
- Rate as: Mild, Moderate, or Severe
- Explain your reasoning

**3. Ayurvedic Perspective**
- Which doshas (Vata, Pitta, Kapha) appear imbalanced based on the condition
- Constitutional factors that may contribute
- Ayurvedic classification of the skin condition

**4. Traditional Ayurvedic Treatments**
- Specific herbs and formulations (like Neem, Turmeric, Manjistha, etc.)
- External applications and oils
- Panchakarma procedures if applicable
- Specific yoga poses or breathing exercises

**5. Dietary Recommendations**
- Foods that support skin healing according to Ayurveda
- Specific fruits, vegetables, spices that help
- Hydration and detoxification foods

**6. Foods to Avoid**
- Foods that may aggravate the condition per Ayurvedic principles
- Common triggers to eliminate

**7. Lifestyle Modifications**
- Daily routine (Dinacharya) recommendations
- Sleep, exercise, and stress management
- Seasonal considerations
- Skin care routine with natural ingredients

Please be specific and practical in your recommendations while maintaining that this is educational information to supplement, not replace, professional medical care.`,
                },
                {
                  type: "image_url",
                  image_url: { url: base64 },
                },
              ],
            },
          ],
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Failed to analyze image");
      }

      const analysisData = await analysisResponse.json();
      const analysisText = analysisData.choices[0]?.message?.content;

      if (!analysisText) {
        throw new Error("No analysis result received");
      }

      // Parse the analysis result
      const result = {
        imageUrl,
        analysisText,
        // Extract specific sections (simplified parsing)
        skinCondition: extractSection(analysisText, "Skin Condition"),
        severity: extractSection(analysisText, "Severity"),
        ayurvedicTreatments: extractSection(
          analysisText,
          "Ayurvedic Treatments",
        ),
        recommendedFoods: extractSection(analysisText, "Recommended Foods"),
        foodsToAvoid: extractSection(analysisText, "Foods to Avoid"),
        lifestyleRecommendations: extractSection(
          analysisText,
          "Lifestyle Recommendations",
        ),
      };

      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert("Error", "Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedImage, upload]);

  const saveAnalysis = useCallback(() => {
    if (!selectedPatient || !analysisResult) {
      Alert.alert(
        "Error",
        "Please select a patient and complete analysis first",
      );
      return;
    }

    saveAnalysisMutation.mutate({
      patient_id: selectedPatient.id,
      image_url: analysisResult.imageUrl,
      skin_condition: analysisResult.skinCondition,
      severity: analysisResult.severity,
      analysis_result: analysisResult.analysisText,
      ayurvedic_treatments: analysisResult.ayurvedicTreatments,
      recommended_foods: analysisResult.recommendedFoods,
      foods_to_avoid: analysisResult.foodsToAvoid,
      lifestyle_recommendations: analysisResult.lifestyleRecommendations,
    });
  }, [selectedPatient, analysisResult, saveAnalysisMutation]);

  // Helper function to extract sections from analysis text
  const extractSection = (text, sectionName) => {
    // Try multiple patterns to extract sections
    const patterns = [
      new RegExp(
        `\\*\\*${sectionName}[^*]*\\*\\*[\\s\\S]*?([\\s\\S]*?)(?=\\*\\*|$)`,
        "i",
      ),
      new RegExp(
        `\\*\\*\\d+\\.\\s*${sectionName}[^*]*\\*\\*[\\s\\S]*?([\\s\\S]*?)(?=\\*\\*|$)`,
        "i",
      ),
      new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*|$)`, "i"),
      new RegExp(`\\*\\*${sectionName}\\*\\*:?\\s*([^*]+)`, "i"),
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1]
          .trim()
          .replace(/^[-•\s]+/, "") // Remove leading bullets or dashes
          .replace(/\n+/g, " ") // Replace multiple newlines with space
          .trim();
      }
    }

    // Fallback: look for keywords
    const keywords = {
      "Skin Condition": ["condition", "appears to be", "diagnosis", "visible"],
      Severity: ["mild", "moderate", "severe", "severity"],
      "Ayurvedic Treatments": [
        "neem",
        "turmeric",
        "manjistha",
        "treatment",
        "herbs",
      ],
      "Recommended Foods": ["eat", "consume", "foods", "diet", "recommended"],
      "Foods to Avoid": ["avoid", "eliminate", "reduce", "limit"],
      "Lifestyle Recommendations": [
        "lifestyle",
        "routine",
        "sleep",
        "exercise",
        "stress",
      ],
    };

    if (keywords[sectionName]) {
      for (const keyword of keywords[sectionName]) {
        const keywordRegex = new RegExp(`[^.]*${keyword}[^.]*\\.`, "gi");
        const matches = text.match(keywordRegex);
        if (matches) {
          return matches.join(" ").trim();
        }
      }
    }

    return "";
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ padding: 20, backgroundColor: "#059669" }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
          }}
        >
          Ayurvedic Skin Analysis
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Patient Selection */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 12,
              color: "#1f2937",
            }}
          >
            Select Patient
          </Text>

          {patients.length === 0 ? (
            <Text style={{ color: "#6b7280", fontStyle: "italic" }}>
              No patients found. Add patients in the Patients tab first.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {patients.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  onPress={() => setSelectedPatient(patient)}
                  style={{
                    backgroundColor:
                      selectedPatient?.id === patient.id
                        ? "#059669"
                        : "#f3f4f6",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <User
                    size={16}
                    color={
                      selectedPatient?.id === patient.id ? "white" : "#6b7280"
                    }
                  />
                  <Text
                    style={{
                      marginLeft: 6,
                      color:
                        selectedPatient?.id === patient.id
                          ? "white"
                          : "#374151",
                      fontWeight: "500",
                    }}
                  >
                    {patient.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Image Selection */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 12,
              color: "#1f2937",
            }}
          >
            Capture Skin Image
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={takePhoto}
              style={{
                flex: 1,
                backgroundColor: "#059669",
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={20} color="white" />
              <Text
                style={{ color: "white", fontWeight: "600", marginLeft: 8 }}
              >
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickImage}
              style={{
                flex: 1,
                backgroundColor: "#6366f1",
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Upload size={20} color="white" />
              <Text
                style={{ color: "white", fontWeight: "600", marginLeft: 8 }}
              >
                Gallery
              </Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <View style={{ alignItems: "center" }}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={{ width: 200, height: 200, borderRadius: 12 }}
                contentFit="cover"
              />
            </View>
          )}
        </View>

        {/* Analysis Button */}
        {selectedImage && (
          <TouchableOpacity
            onPress={analyzeImage}
            disabled={isAnalyzing || uploadLoading}
            style={{
              backgroundColor:
                isAnalyzing || uploadLoading ? "#9ca3af" : "#f59e0b",
              paddingVertical: 16,
              borderRadius: 12,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isAnalyzing || uploadLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Sparkles size={24} color="white" />
            )}
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "600",
                marginLeft: 8,
              }}
            >
              {isAnalyzing
                ? "Analyzing..."
                : uploadLoading
                  ? "Uploading..."
                  : "Analyze Skin Condition"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 16,
                color: "#1f2937",
              }}
            >
              Analysis Results
            </Text>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={{ fontSize: 14, lineHeight: 20, color: "#374151" }}>
                {analysisResult.analysisText}
              </Text>
            </ScrollView>

            {/* Save Analysis Button */}
            <TouchableOpacity
              onPress={saveAnalysis}
              disabled={!selectedPatient || saveAnalysisMutation.isLoading}
              style={{
                backgroundColor:
                  selectedPatient && !saveAnalysisMutation.isLoading
                    ? "#059669"
                    : "#9ca3af",
                paddingVertical: 12,
                borderRadius: 8,
                marginTop: 16,
                alignItems: "center",
              }}
            >
              {saveAnalysisMutation.isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={{ color: "white", fontWeight: "600" }}>
                  Save Analysis
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
