import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Property } from '@/types';
import { Card } from '@/components/ui/Card';
import { Building, MapPin, DollarSign, Bed, Bath, Square } from 'lucide-react-native';

export default function PropertiesScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProperties = async () => {
    try {
      const propertiesQuery = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(propertiesQuery);
      const propertiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Property[];
      
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10b981';
      case 'occupied':
        return '#3b82f6';
      case 'maintenance':
        return '#f59e0b';
      case 'inactive':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'maintenance':
        return 'Maintenance';
      case 'inactive':
        return 'Inactive';
      default:
        return status;
    }
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <TouchableOpacity activeOpacity={0.7}>
      <Card style={styles.propertyCard}>
        <View style={styles.propertyHeader}>
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName}>{property.name}</Text>
            <View style={styles.addressRow}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.address}>{property.address}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(property.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(property.status) }]}>
              {getStatusText(property.status)}
            </Text>
          </View>
        </View>

        <View style={styles.propertyDetails}>
          <View style={styles.detailItem}>
            <DollarSign size={16} color="#6b7280" />
            <Text style={styles.detailText}>${property.rent.toLocaleString()}/mo</Text>
          </View>
          {property.bedrooms && (
            <View style={styles.detailItem}>
              <Bed size={16} color="#6b7280" />
              <Text style={styles.detailText}>{property.bedrooms} bed</Text>
            </View>
          )}
          {property.bathrooms && (
            <View style={styles.detailItem}>
              <Bath size={16} color="#6b7280" />
              <Text style={styles.detailText}>{property.bathrooms} bath</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Square size={16} color="#6b7280" />
            <Text style={styles.detailText}>{property.area} sq ft</Text>
          </View>
        </View>

        <View style={styles.propertyFooter}>
          <Text style={styles.propertyType}>{property.type.charAt(0).toUpperCase() + property.type.slice(1)}</Text>
          <Text style={styles.propertyDate}>
            Added {property.createdAt?.toLocaleDateString()}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Properties</Text>
        <Text style={styles.subtitle}>{properties.length} total properties</Text>
      </View>

      <FlatList
        data={properties}
        renderItem={({ item }) => <PropertyCard property={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  propertyCard: {
    marginBottom: 16,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  propertyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  propertyType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  propertyDate: {
    fontSize: 12,
    color: '#6b7280',
  },
});
