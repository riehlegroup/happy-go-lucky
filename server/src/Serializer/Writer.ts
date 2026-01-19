import { Serializable } from "./Serializable";

/**
 * Generic Writer
 */
export interface Writer {
    /**
     * writeRoot() contains the main loop which writes @param rootObject
     * and all referenced objects.
     * @param rootObject Object to be written.
     */
    writeRoot(rootObject: Serializable): Promise<void>;

    /**
     * Writes an object to backend. First writes the reference and then queues the Object for writing, if it was not handled previously.
     * @param attributeName Name used to identify the object reference when reading/writing.
     * @param objRef Serializable to be written.
     */
    writeObject<T extends Serializable>(attributeName: string, objRef: T | null): void;

    /**
     * Writes multiple objects to backend (1 to n relation).
     * @param referenceColumnName Name of the column in the table of @params objRefs which references this id.
     * @param objRefs Serializables to be written.
     */
    writeObjects<T extends Serializable>(referenceColumnName: string, objRefs: T[]): void;

    /**
     * Writes @param string to backend with @param attributeName.
     * @param attributeName Name used to identify the attribute when reading/writing.
     * @param string Attribute Value.
     */
    writeString(attributeName: string, string: string | null): void;

    /**
     * Writes @param number to backend with @param attributeName.
     * @param attributeName Name used to identify the attribute when reading/writing.
     * @param number Attribute Value.
     */
    writeNumber(attributeName: string, number: number | null): void;

    /**
     * 
     * Writes @param dateTime to backend with @param attributeName.
     * @param attributeName Name used to identify the attribute when reading/writing.
     * @param dateTime Attribute Value.
     */
    writeDateTime(attributeName: string, dateTime: Date): void;
}