import { DataSource } from 'typeorm';
import { databaseDataSourceOptions } from './database.options';

export default new DataSource(databaseDataSourceOptions);
