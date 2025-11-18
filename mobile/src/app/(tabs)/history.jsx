import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, User, Calendar, Eye, ChevronRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAnalysis, setExpandedAnalysis] = useState(null);

  // Fetch patients for selection
  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    },
  });

  const patients = patientsData?.patients || [];

  // Fetch analyses for selected patient
  const { data: analysesData, isLoading } = useQuery({
    queryKey: ['skin-analyses', selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient) return { analyses: [] };
      const response = await fetch(`/api/skin-analysis?patient_id=${selectedPatient.id}`);
      if (!response.ok) throw new Error('Failed to fetch analyses');
      return response.json();
    },
    enabled: !!selectedPatient,
  });

  const analyses = analysesData?.analyses || [];

  // Filter patients based on search
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getSeverityColor = useCallback((severity) => {
    switch (severity?.toLowerCase()) {
      case 'mild': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'severe': return '#ef4444';
      default: return '#6b7280';
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', paddingTop: insets.top }}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={{ padding: 20, backgroundColor: '#059669' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
          Analysis History
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Patient Selection */}
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1f2937' }}>
            Select Patient
          </Text>

          {/* Search Bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 }}>
            <Search size={20} color="#6b7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search patients..."
              style={{ flex: 1, marginLeft: 8, fontSize: 16, color: '#374151' }}
            />
          </View>

          {filteredPatients.length === 0 ? (
            <Text style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 }}>
              {searchQuery ? 'No patients found matching your search' : 'No patients available'}
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filteredPatients.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  onPress={() => setSelectedPatient(patient)}
                  style={{
                    backgroundColor: selectedPatient?.id === patient.id ? '#059669' : '#f3f4f6',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <User size={16} color={selectedPatient?.id === patient.id ? 'white' : '#6b7280'} />
                  <Text style={{
                    marginLeft: 6,
                    color: selectedPatient?.id === patient.id ? 'white' : '#374151',
                    fontWeight: '500',
                  }}>
                    {patient.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Analysis History */}
        {selectedPatient && (
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1f2937' }}>
              Analysis History for {selectedPatient.name}
            </Text>

            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="large" color="#059669" />
              </View>
            ) : analyses.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Eye size={48} color="#9ca3af" />
                <Text style={{ color: '#6b7280', fontSize: 16, marginTop: 8, textAlign: 'center' }}>
                  No analysis history found for this patient
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 500 }}>
                {analyses.map((analysis, index) => (
                  <View
                    key={analysis.id}
                    style={{
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Analysis Header */}
                    <TouchableOpacity
                      onPress={() => setExpandedAnalysis(
                        expandedAnalysis === analysis.id ? null : analysis.id
                      )}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        backgroundColor: '#f9fafb',
                      }}
                    >
                      <Image
                        source={{ uri: analysis.image_url }}
                        style={{ width: 60, height: 60, borderRadius: 8 }}
                        contentFit="cover"
                      />
                      
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                            {analysis.skin_condition || 'Skin Analysis'}
                          </Text>
                          {analysis.severity && (
                            <View style={{
                              backgroundColor: getSeverityColor(analysis.severity),
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                              marginLeft: 8,
                            }}>
                              <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
                                {analysis.severity}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Calendar size={14} color="#6b7280" />
                          <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 4 }}>
                            {formatDate(analysis.created_at)}
                          </Text>
                        </View>
                      </View>

                      <ChevronRight 
                        size={20} 
                        color="#6b7280" 
                        style={{
                          transform: [{ 
                            rotate: expandedAnalysis === analysis.id ? '90deg' : '0deg' 
                          }]
                        }}
                      />
                    </TouchableOpacity>

                    {/* Expanded Analysis Details */}
                    {expandedAnalysis === analysis.id && (
                      <View style={{ padding: 16, backgroundColor: 'white' }}>
                        {analysis.analysis_result && (
                          <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>
                              Full Analysis
                            </Text>
                            <ScrollView style={{ maxHeight: 200 }}>
                              <Text style={{ fontSize: 14, lineHeight: 20, color: '#374151' }}>
                                {analysis.analysis_result}
                              </Text>
                            </ScrollView>
                          </View>
                        )}

                        {analysis.ayurvedic_treatments && (
                          <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                              Ayurvedic Treatments
                            </Text>
                            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 18 }}>
                              {analysis.ayurvedic_treatments}
                            </Text>
                          </View>
                        )}

                        {analysis.recommended_foods && (
                          <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#059669', marginBottom: 4 }}>
                              Recommended Foods
                            </Text>
                            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 18 }}>
                              {analysis.recommended_foods}
                            </Text>
                          </View>
                        )}

                        {analysis.foods_to_avoid && (
                          <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#ef4444', marginBottom: 4 }}>
                              Foods to Avoid
                            </Text>
                            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 18 }}>
                              {analysis.foods_to_avoid}
                            </Text>
                          </View>
                        )}

                        {analysis.lifestyle_recommendations && (
                          <View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#6366f1', marginBottom: 4 }}>
                              Lifestyle Recommendations
                            </Text>
                            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 18 }}>
                              {analysis.lifestyle_recommendations}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}