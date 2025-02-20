/**
 * @Author: Gongxh
 * @Date: 2024-12-07
 * @Description: 定时器管理类
 */

import { BinaryHeap } from "../DataStruct/BinaryHeap";
import { TimerNode } from "./TimerNode";
import { TimerNodePool } from "./TimerNodePool";

export class Timer {
    private _timerNodeOrder: number = 0;

    /** 经过的时间 */
    private _elapsedTime: number = 0;

    private _pool: TimerNodePool;
    private _heap: BinaryHeap<TimerNode>;

    /** 暂停的计时器 */
    private _pausedTimers: Map<number, TimerNode>;

    /**
     * 定时器数量
     * @readonly
     * @type {number}
     */
    public get timerCount(): number {
        return this._heap.count;
    }

    /**
     * 定时器管理类
     *
     * @param {number} initTimerCapacity 初始定时器容量
     * @memberof Timer
     */
    public constructor(initTimerCapacity: number) {
        this._heap = new BinaryHeap<TimerNode>(initTimerCapacity);
        this._pool = new TimerNodePool(initTimerCapacity);
        this._pausedTimers = new Map<number, TimerNode>();
    }

    /**
     * 启动一个计时器
     * @param { Function } callback 回调方法
     * @param {number} interval 回调间隔 (秒)
     * @param {number} [loop=0] 重复次数：0：回调一次，1~n：回调n次，-1：无限重复
     * @returns {number} 返回计时器id
     */
    public start(callback: () => void, interval: number, loop: number = 0): number {
        const timerNode = this._getTimerNode(callback, interval, loop);
        this._heap.push(timerNode);
        return timerNode.id;
    }

    /**
     * 删除指定计时器
     *
     * @param {number} timerId 定时器ID
     * @memberof Timer
     */
    public stop(timerId: number): void {
        const timerNode = this._pool.get(timerId);

        if (timerNode) {
            if (timerNode.pause) {
                this._pausedTimers.delete(timerId);
            }

            this._heap.remove(timerNode);
            this._pool.recycle(timerId);
        }
    }

    /**
     * 暂停定时器
     *
     * @param {number} timerId 定时器ID
     * @memberof Timer
     */
    public pause(timerId: number): void {
        const timerNode = this._pool.get(timerId);

        if (timerNode) {
            timerNode.pauseRemainTime = timerNode.expireTime - this._elapsedTime;
            this._heap.remove(timerNode);
            this._pausedTimers.set(timerId, timerNode);
        }
    }

    /**
     * 继续定时器
     *
     * @param {number} timerId 定时器ID
     * @memberof Timer
     */
    public resume(timerId: number): void {
        const timerNode = this._pausedTimers.get(timerId);

        if (timerNode) {
            timerNode.pause = false;
            timerNode.expireTime = this._elapsedTime + timerNode.pauseRemainTime;
            this._pausedTimers.delete(timerId);
            this._heap.push(timerNode);
        }
    }

    // /**
    //  * 根据回调更新定时器
    //  *
    //  * @param {number} timerId 定时器ID
    //  * @param {number} interval 回调间隔
    //  * @param {number} loop 重复次数
    //  * @param {boolean} [resetTime=false] 是否更新下次回调时间（从当前时间开始计时）
    //  * @returns {boolean} 如果TimerID存在则返回true
    //  * @memberof Timer
    //  */
    // public updateTimer(timerId: number, interval: number, loop: number, resetTime: boolean = false): boolean {
    //     const timerNode = this._pool.get(timerId);
    //     if (!timerNode) {
    //         return false;
    //     }
    //     timerNode.interval = interval;
    //     timerNode.loop = loop;
    //     if (resetTime) {
    //         timerNode.expireTime = this._elapsedTime + interval;
    //     }
    //     return this._heap.update(timerNode);
    // }

    /**
     * 更新时钟
     *
     * @param {number} deltaTime 更新间隔
     * @memberof Timer
     */
    public update(deltaTime: number): void {
        const elapsedTime = (this._elapsedTime += deltaTime);

        const heap = this._heap;
        let timerNode = heap.top();

        while (timerNode && timerNode.expireTime <= elapsedTime) {
            const callback = timerNode.callback;
            if (timerNode.loop == 0) {
                heap.pop();
                this._recycle(timerNode);
            } else if (timerNode.loop > 0) {
                // 处理多次回调定时器
                if (--timerNode.loop == 0) {
                    heap.pop();
                    this._recycle(timerNode);
                } else {
                    // 更新下一次回调
                    timerNode.expireTime = timerNode.expireTime + timerNode.interval;
                    heap.update(timerNode);
                }
            } else {
                // 无限次数回调
                // 更新下一次回调
                timerNode.expireTime = timerNode.expireTime + timerNode.interval;
                heap.update(timerNode);
            }

            callback();
            timerNode = heap.top();
        }
    }

    /**
     * 清空所有定时器
     *
     * @memberof Timer
     */
    public clear(): void {
        this._heap.clear();
        this._pool.clear();
        this._pausedTimers.clear();
        this._timerNodeOrder = 0;
    }

    private _getTimerNode(callback: () => void, interval: number, loop: number): TimerNode {
        const timerNode = this._pool.allocate();

        timerNode.orderIndex = ++this._timerNodeOrder;
        timerNode.callback = callback;
        timerNode.interval = interval;
        timerNode.expireTime = this._elapsedTime + interval;
        timerNode.loop = loop;
        timerNode.pause = false;

        return timerNode;
    }

    private _recycle(timerNode: TimerNode): void {
        this._pool.recycle(timerNode.id);
    }
}