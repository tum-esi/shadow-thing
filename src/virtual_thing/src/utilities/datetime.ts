import { VTMNode, u } from "../index";
import { format } from 'date-fns'

/** 
 * This enum defines the tockens that cat be used in
 * pointers after a 'dt' tocken to access DateTime values, e.g.:
 * 'dt/unix'.
 */
enum DateTimeComponent {
    UnixMillis = "unix",
    ISO = "iso",
    Local = "local",
    LocalTime = "l_time",
    LocalDate = "l_date",
    LocalMillisecond = "l_ms",
    LocalSecond = "l_s",
    LocalMinute = "l_m",
    LocalHour = "l_h",
    LocalDayOfMonth = "l_d",
    LocalMonth = "l_M",
    LocalYear = "l_y",
    LocalDayOfWeek = "l_wd",
    UTC = "utc",
    UTCTime = "u_time",
    UTCDate = "u_date",
    UTCMillisecond = "u_ms",
    UTCSecond = "u_s",
    UTCMinute = "u_m",
    UTCHour = "u_h",
    UTCDayOfMonth = "u_d",
    UTCMonth = "u_M",
    UTCYear = "u_y",
    UTCDayOfWeek = "u_wd"
}

/** Provides DateTime values with custom formatting options. */
export class DateTime extends VTMNode{

    // RegExp to match the beginning of a valid DateTime expression string
    private static readonly dtBeginRegExp: RegExp = /^\/?dt\/(.*)/;

    // RegExp to match an entire valid DateTime expression string
    private static readonly validDtRegExp: RegExp = /^(\/?dt\/)((local|utc)(\(([^()]*)\))?|unix|iso|l_time|l_date|l_ms|l_s|l_M|l_h|l_d|l_m|l_y|l_wd|u_time|u_date|u_ms|u_s|u_m|u_h|u_d|u_M|u_y|u_wd)$/;

    public constructor(parent: VTMNode){
        super(undefined, parent);
    }

    /**
     * Checks if the given string is a DateTime expression.
     * A string is a DateTime expression (valid or invalid)
     * if it starts with "dt/" or "/dt/".
     * 
     * @param str The string to check.
     */
    public static isDTExpr(str: string): boolean {
        return str.match(this.dtBeginRegExp) != undefined;
    }

    /**
     * Checks if the given string is a valid DateTime expression.  
     * Valid DateTime expressions can be of the following form:
     * - For all entries in 'DateTimeComponent' enum:
     * 
     *          "/dt/<entry>" or "dt/<entry>", e.g. "dt/l_date"
     * - For the 'Local' and 'UTC' entries additionally
     * a format can be specified using the patterns from https://date-fns.org/v2.16.1/docs/format:
     * 
     *          "/dt/<entry>(<format>)", e.g. "/dt/utc(hh:mm:ss)"
     * 
     * @param str The string to check.
     */
    public static isValidDTExpr(str: string): boolean {
        return str.match(this.validDtRegExp) != undefined;
    }

    /**
     * Returns a DateTime value defined by the given expression.
     * 
     * @param dtExpression A valid DateTime expression string.
     * Valid DateTime expressions can be of the following form:
     * - For all entries in 'DateTimeComponent' enum:  
     * "/dt/entry" or "dt/entry", e.g. "dt/l_date"
     * - For the 'Local' and 'UTC' entries additionally
     * a format can be specified using the patterns from https://date-fns.org/v2.16.1/docs/format:  
     * "/dt/entry(format)", e.g. "/dt/utc(hh:mm:ss)"
     */
    public get(dtExpression: string){

        if(!DateTime.isValidDTExpr(dtExpression)){
            u.fatal("Invalid Datetime expression: " + dtExpression, this.getFullPath());
        }

        let local = new Date();

        let dtComponent = '';

        // retrieve format if present
        let formatStr = dtExpression.replace(DateTime.validDtRegExp, "$5");
        
        if(formatStr == ''){
            // retrieve the DateTimeComponent value
            dtComponent = dtExpression.replace(DateTime.validDtRegExp, "$2");
        }else{
            // retrieve the DateTimeComponent value
            dtComponent = dtExpression.replace(DateTime.validDtRegExp, "$3");
            try{
                if(dtComponent == DateTimeComponent.Local){
                    // return formatted local date
                    return format(local, formatStr);
                }else{
                    // return formatted UTC date
                    return format(new Date(local.getTime() + local.getTimezoneOffset() * 60000), formatStr);
                }
            }catch(err){
                u.fatal(err.message, this.getFullPath());
            }                        
        }

        switch(dtComponent){
            case DateTimeComponent.UnixMillis:
                return Date.now();
            case DateTimeComponent.ISO:
                return local.toISOString();
            case DateTimeComponent.Local:
                return local.toLocaleString();
            case DateTimeComponent.LocalTime:
                return local.toTimeString();
            case DateTimeComponent.LocalDate:
                return local.toDateString();
            case DateTimeComponent.LocalMillisecond:
                return local.getMilliseconds();
            case DateTimeComponent.LocalSecond:
                return local.getSeconds();
            case DateTimeComponent.LocalMinute:
                return local.getMinutes();
            case DateTimeComponent.LocalHour:
                return local.getHours();
            case DateTimeComponent.LocalDayOfMonth:
                return local.getDate();
            case DateTimeComponent.LocalMonth:
                return local.getMonth();
            case DateTimeComponent.LocalYear:
                return local.getFullYear();
            case DateTimeComponent.LocalDayOfWeek:
                return local.getDay();
            case DateTimeComponent.UTC:
                return local.toUTCString();
            case DateTimeComponent.UTCTime:
                return new Date(local.getTime() + local.getTimezoneOffset() * 60000)
                    .toTimeString();
            case DateTimeComponent.UTCDate:
                return new Date(local.getTime() + local.getTimezoneOffset() * 60000)
                    .toDateString();
            case DateTimeComponent.UTCMillisecond:
                return local.getUTCMilliseconds();
            case DateTimeComponent.UTCSecond:
                return local.getUTCSeconds();
            case DateTimeComponent.UTCMinute:
                return local.getUTCMinutes();
            case DateTimeComponent.UTCHour:
                return local.getUTCHours();
            case DateTimeComponent.UTCDayOfMonth:
                return local.getUTCDate();
            case DateTimeComponent.UTCMonth:
                return local.getUTCMonth();
            case DateTimeComponent.UTCYear:
                return local.getUTCFullYear();
            case DateTimeComponent.UTCDayOfWeek:
                return local.getUTCDay();
        }

        return undefined;
    }
}

