import { db } from './db';
import { services } from '@shared/schema';
import { isNull, or, eq } from 'drizzle-orm';

async function migrateServiceLocations() {
  console.log('Starting service location migration...');
  
  // Get all services without coordinates
  const servicesToMigrate = await db
    .select()
    .from(services)
    .where(or(isNull(services.locationLat), isNull(services.locationLng)));
  
  console.log(`Found ${servicesToMigrate.length} services to migrate`);
  
  let geocoded = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const service of servicesToMigrate) {
    // Skip if no locations
    if (!service.locations || service.locations.length === 0) {
      skipped++;
      continue;
    }
    
    const firstLocation = service.locations[0];
    console.log(`Geocoding service ${service.id}: ${firstLocation}`);
    
    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(firstLocation)}&format=json&countrycodes=ch&limit=1`;
      const response = await fetch(geocodeUrl, {
        headers: { 'User-Agent': 'ServiceMarketplace/1.0' }
      });
      
      if (!response.ok) {
        console.error(`  Failed to geocode (HTTP ${response.status})`);
        failed++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      const results = await response.json();
      
      if (!results || results.length === 0) {
        console.error(`  No results found`);
        failed++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      const locationLat = parseFloat(results[0].lat);
      const locationLng = parseFloat(results[0].lon);
      
      // Update service
      await db
        .update(services)
        .set({
          locationLat: locationLat.toString(),
          locationLng: locationLng.toString(),
          preferredLocationName: firstLocation,
        })
        .where(eq(services.id, service.id));
      
      console.log(`  ✓ Geocoded to: ${locationLat}, ${locationLng}`);
      geocoded++;
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  Error geocoding:`, error);
      failed++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\nMigration complete!');
  console.log(`Successfully geocoded: ${geocoded}`);
  console.log(`Skipped (no location): ${skipped}`);
  console.log(`Failed: ${failed}`);
  
  process.exit(0);
}

migrateServiceLocations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
