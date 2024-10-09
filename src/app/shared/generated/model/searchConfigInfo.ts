/**
 * onecx-search-config-bff
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export interface SearchConfigInfo { 
    id: string;
    name: string;
    columns: Array<string>;
    values: { [key: string]: string; };
    /**
     * Defines whether this config can be changed in the UI
     */
    isReadonly: boolean;
    /**
     * Indicates whether the advanced mode should be displayed
     */
    isAdvanced: boolean;
}

