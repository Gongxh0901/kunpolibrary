/**
 * @Author: Gongxh
 * @Date: 2024-12-21
 * @Description: 
 */

import { Event } from "./Event";

/** @internal */
export class EventFactory {
    private _id: number = 0;
    private _stack: Event[] = [];
    private _maxCapacity: number = 64;
    private _msgClass: new () => Event;

    get id(): number {
        return this._id++;
    }

    constructor(capacity: number, objectClass: new () => Event) {
        this._maxCapacity = capacity;
        this._msgClass = objectClass;
    }

    public allocate<T extends Event>(): T {
        if (this._stack.length == 0) {
            const ret = new this._msgClass() as T;
            ret.id = this.id;
            return ret;
        }
        const ret = this._stack.pop() as T;
        ret._reset();
        return ret;
    }

    public recycle(ret: Event): boolean {
        if (this._maxCapacity > 0 && this._stack.length < this._maxCapacity) {
            ret._recycle();
            this._stack.push(ret);
            return true;
        }
        return false;
    }
}