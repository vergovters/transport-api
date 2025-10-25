import { createMachine, assign } from 'xstate';
import { RouteStatus, RouteStatusEnum } from '../models/enums';

interface RouteContext {
    routeId: string;
    vehicleId?: string;
    departureDate?: Date;
    completionDate?: Date;
    error?: string;
}

type RouteEvent =
    | { type: 'ASSIGN_VEHICLE'; vehicleId: string }
    | { type: 'START_ROUTE'; departureDate?: Date }
    | { type: 'COMPLETE_ROUTE'; completionDate?: Date }
    | { type: 'CANCEL_ROUTE'; reason?: string }
    | { type: 'RETRY' };

export const routeMachine = createMachine({
    id: 'route',
    types: {} as {
        context: RouteContext;
        events: RouteEvent;
    },
    initial: RouteStatusEnum.enum.PENDING,
    context: {
        routeId: '',
        vehicleId: undefined,
        departureDate: undefined,
        completionDate: undefined,
        error: undefined,
    },
    states: {
        [RouteStatusEnum.enum.PENDING]: {
            on: {
                ASSIGN_VEHICLE: {
                    target: 'assigned',
                    actions: assign({
                        vehicleId: ({ event }) => event.vehicleId,
                    }),
                },
                START_ROUTE: {
                    target: RouteStatusEnum.enum.IN_PROGRESS,
                    actions: assign({
                        departureDate: ({ event }) => event.departureDate || new Date(),
                    }),
                },
                CANCEL_ROUTE: {
                    target: RouteStatusEnum.enum.CANCELLED,
                    actions: assign({
                        error: ({ event }) => event.reason,
                    }),
                },
            },
        },
        assigned: {
            on: {
                START_ROUTE: {
                    target: RouteStatusEnum.enum.IN_PROGRESS,
                    actions: assign({
                        departureDate: ({ event }) => event.departureDate || new Date(),
                    }),
                },
                CANCEL_ROUTE: {
                    target: RouteStatusEnum.enum.CANCELLED,
                    actions: assign({
                        error: ({ event }) => event.reason,
                    }),
                },
            },
        },
        [RouteStatusEnum.enum.IN_PROGRESS]: {
            on: {
                COMPLETE_ROUTE: {
                    target: RouteStatusEnum.enum.COMPLETED,
                    actions: assign({
                        completionDate: ({ event }) => event.completionDate || new Date(),
                    }),
                },
                CANCEL_ROUTE: {
                    target: RouteStatusEnum.enum.CANCELLED,
                    actions: assign({
                        error: ({ event }) => event.reason,
                    }),
                },
            },
        },
        [RouteStatusEnum.enum.COMPLETED]: {
            type: 'final',
        },
        [RouteStatusEnum.enum.CANCELLED]: {
            on: {
                RETRY: {
                    target: RouteStatusEnum.enum.PENDING,
                    actions: assign({
                        error: undefined,
                    }),
                },
            },
        },
    },
});

export function mapStateToRouteStatus(state: string): RouteStatus {
    switch (state) {
        case 'assigned':
            return RouteStatusEnum.enum.PENDING;
        case RouteStatusEnum.enum.PENDING:
            return RouteStatusEnum.enum.PENDING;
        case RouteStatusEnum.enum.IN_PROGRESS:
            return RouteStatusEnum.enum.IN_PROGRESS;
        case RouteStatusEnum.enum.COMPLETED:
            return RouteStatusEnum.enum.COMPLETED;
        case RouteStatusEnum.enum.CANCELLED:
            return RouteStatusEnum.enum.CANCELLED;
        default:
            return RouteStatusEnum.enum.PENDING;
    }
}

export function mapRouteStatusToState(status: RouteStatus): string {
    switch (status) {
        case RouteStatusEnum.enum.PENDING:
            return RouteStatusEnum.enum.PENDING;
        case RouteStatusEnum.enum.IN_PROGRESS:
            return RouteStatusEnum.enum.IN_PROGRESS;
        case RouteStatusEnum.enum.COMPLETED:
            return RouteStatusEnum.enum.COMPLETED;
        case RouteStatusEnum.enum.CANCELLED:
            return RouteStatusEnum.enum.CANCELLED;
        default:
            return RouteStatusEnum.enum.PENDING;
    }
}