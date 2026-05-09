const schemaManagementMode = String(process.env.SCHEMA_MANAGEMENT_MODE || 'runtime')
  .trim()
  .toLowerCase();

const useMigrationManagedSchema = schemaManagementMode === 'migrations';

module.exports = {
  useMigrationManagedSchema,
  schemaManagementMode,
};
