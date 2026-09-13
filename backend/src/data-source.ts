import { DataSource } from 'typeorm';
import { buildDatabaseDataSourceOptions } from './database.options';

export default new DataSource(buildDatabaseDataSourceOptions());
