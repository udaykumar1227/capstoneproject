import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, User, Phone, Mail, Edit3, Search } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import KeyboardAvoidingAnimatedView from '@/components/KeyboardAvoidingAnimatedView';

export default function PatientsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
  });

  // Fetch patients
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['patients', searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/patients?search=${encodeURIComponent(searchQuery)}`
        : '/api/patients';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    },
  });

  const patients = patientsData?.patients || [];

  // Add patient mutation
  const addPatientMutation = useMutation({
    mutationFn: async (patientData) => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      });
      if (!response.ok) throw new Error('Failed to add patient');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowAddForm(false);
      setFormData({ name: '', age: '', gender: '', phone: '', email: '' });
      Alert.alert('Success', 'Patient added successfully!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add patient');
    },
  });

  const handleAddPatient = useCallback(() => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Patient name is required');
      return;
    }

    const patientData = {
      name: formData.name.trim(),
      age: formData.age ? parseInt(formData.age) : null,
      gender: formData.gender.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
    };

    addPatientMutation.mutate(patientData);
  }, [formData, addPatientMutation]);

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View style={{ flex: 1, backgroundColor: '#f8fafc', paddingTop: insets.top }}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={{ padding: 20, backgroundColor: '#059669' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
            Patient Management
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Search Bar */}
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Search size={20} color="#6b7280" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search patients by name..."
                style={{ flex: 1, marginLeft: 8, fontSize: 16, color: '#374151' }}
              />
            </View>
          </View>

          {/* Add Patient Button */}
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={{
              backgroundColor: '#059669',
              paddingVertical: 16,
              borderRadius: 12,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={24} color="white" />
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginLeft: 8 }}>
              {showAddForm ? 'Cancel' : 'Add New Patient'}
            </Text>
          </TouchableOpacity>

          {/* Add Patient Form */}
          {showAddForm && (
            <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1f2937' }}>
                Add New Patient
              </Text>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                  Name *
                </Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  placeholder="Enter patient name"
                  style={{
                    backgroundColor: '#f9fafb',
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 16,
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                    Age
                  </Text>
                  <TextInput
                    value={formData.age}
                    onChangeText={(value) => updateFormData('age', value)}
                    placeholder="Age"
                    keyboardType="numeric"
                    style={{
                      backgroundColor: '#f9fafb',
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                    Gender
                  </Text>
                  <TextInput
                    value={formData.gender}
                    onChangeText={(value) => updateFormData('gender', value)}
                    placeholder="Gender"
                    style={{
                      backgroundColor: '#f9fafb',
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                    }}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                  Phone
                </Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  style={{
                    backgroundColor: '#f9fafb',
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 16,
                  }}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                  Email
                </Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: '#f9fafb',
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 16,
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={handleAddPatient}
                disabled={addPatientMutation.isLoading}
                style={{
                  backgroundColor: addPatientMutation.isLoading ? '#9ca3af' : '#059669',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                {addPatientMutation.isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    Add Patient
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Patients List */}
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1f2937' }}>
              Patients ({patients.length})
            </Text>

            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="large" color="#059669" />
              </View>
            ) : patients.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <User size={48} color="#9ca3af" />
                <Text style={{ color: '#6b7280', fontSize: 16, marginTop: 8, textAlign: 'center' }}>
                  {searchQuery ? 'No patients found matching your search' : 'No patients added yet'}
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {patients.map((patient, index) => (
                  <View
                    key={patient.id}
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: index < patients.length - 1 ? 1 : 0,
                      borderBottomColor: '#f3f4f6',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                          {patient.name}
                        </Text>
                        
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {patient.age && (
                            <Text style={{ fontSize: 14, color: '#6b7280' }}>
                              Age: {patient.age}
                            </Text>
                          )}
                          {patient.gender && (
                            <Text style={{ fontSize: 14, color: '#6b7280' }}>
                              • {patient.gender}
                            </Text>
                          )}
                        </View>

                        {patient.phone && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Phone size={14} color="#6b7280" />
                            <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 4 }}>
                              {patient.phone}
                            </Text>
                          </View>
                        )}

                        {patient.email && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Mail size={14} color="#6b7280" />
                            <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 4 }}>
                              {patient.email}
                            </Text>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity
                        style={{
                          backgroundColor: '#f3f4f6',
                          padding: 8,
                          borderRadius: 8,
                        }}
                      >
                        <Edit3 size={16} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}