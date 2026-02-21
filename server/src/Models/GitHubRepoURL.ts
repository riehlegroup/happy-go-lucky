import { URL } from "node:url";
import { IllegalArgumentException } from "../Exceptions/IllegalArgumentException";


export class GitHubRepoURL {
    private readonly url: URL;

    /**
     * Value type for GitHub URLs. Only http:// and https:// URLs are supported.
     *
     * @param input - The URL to be parsed as a string
     * @returns The value type object
     */
    constructor(input: string) {
        const url = URL.parse(input);
        if (!url)
            throw new IllegalArgumentException("Invalid URL");
        this.url = url;

        if (!this.isGitHubUrl())
            throw new IllegalArgumentException("Not a GitHub URL");

        if (!this.isValidProtocol())
            throw new IllegalArgumentException("Unsupported protocol");
        
        if (!this.isRepo())
            throw new IllegalArgumentException("The URL has no repository structure");
        }
    
    /**
     * @returns The whole URL as a string
    */
   public asString() {
       return this.url.href;
    }

    /**
     * Checks if the URL hostname is github.com
     * @returns True if the check succeeds, else false
     */
    private isGitHubUrl() {
        return this.url.hostname === "github.com" ||
            this.url.hostname === "www.github.com";
    }

    /**
     * Checks if the URL protocol is http or https
     * @returns True if the check succeeds, else false
     */
    private isValidProtocol() {
        return this.url.protocol === "http:" ||
            this.url.protocol === "https:";
    }

    /**
     * Checks if the URL pathname contains exactly two slashes with something
     * behind them
     * @returns True if the check succeeds, else false
     */
    private isRepo() {
        return (this.url.pathname.match(/\/./g) || []).length === 2;
    }
}