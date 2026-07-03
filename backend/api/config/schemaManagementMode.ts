const schemaManagementMode: string = String(process.env.SCHEMA_MANAGEMENT_MODE || 'runtime')
  .trim()
  .toLowerCase();

const useMigrationManagedSchema: boolean = schemaManagementMode === 'migrations';

module.exports = {
  useMigrationManagedSchema,
  schemaManagementMode,
};
