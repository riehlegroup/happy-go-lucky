import { Reader } from "./Reader";
import { Writer } from "../Serializer/Writer";


/**
 * For object creation please use a SerializableFactory!
 */
export interface Serializable {
    /**
     * Reads attributes with the specified Reader.
     * @param reader Reader Object to read from. E.g. a DatabaseReader.
     */
    readFrom(reader: Reader): void | Promise<void>;

    /**
     * Writes attributes with the specified Writer
     * @param writer Writer Object to write attributes. E.g. a DatabaseWriter
     */
    writeTo(writer: Writer): void;
}