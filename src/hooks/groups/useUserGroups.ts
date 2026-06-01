import { CatalogGroupsComposer, GetSessionDataManager, GuildMembershipsMessageEvent, HabboGroupEntryData, UserProfileComposer, UserProfileEvent } from '@nitrots/nitro-renderer';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { awaitNitroResponse } from '../../api/nitro-query';

/**
 * The list of guilds the current Habbo belongs to, as returned by
 * the `CatalogGroupsComposer` → `GuildMembershipsMessageEvent`
 * request/response pair.
 *
 * Group membership can change during the same client session when the
 * user creates, joins, leaves, or is accepted into a guild. Keep this
 * query fresh on mount so catalog group furniture does not get stuck
 * with an earlier empty membership list.
 *
 * Replaces three duplicate request+listener pairs that previously
 * each issued their own CatalogGroupsComposer:
 *   - useCatalog (catalogOptions.groups)
 *   - WiredSelectorUsersGroupView
 *   - WiredConditionActorIsGroupMemberView
 */
export const useUserGroups = (
    options: { enabled?: boolean } = {}
): UseQueryResult<HabboGroupEntryData[]> =>
    useQuery<HabboGroupEntryData[], Error, HabboGroupEntryData[]>({
        queryKey: [ 'nitro', 'user', 'groups' ],
        queryFn: async () =>
        {
            let catalogGroups: HabboGroupEntryData[] = [];

            try
            {
                catalogGroups = await awaitNitroResponse<GuildMembershipsMessageEvent, HabboGroupEntryData[]>({
                    request: () => new CatalogGroupsComposer(),
                    parser: GuildMembershipsMessageEvent,
                    select: event => (event.getParser().groups || []),
                    timeoutMs: 5000
                });
            }
            catch
            {
                catalogGroups = [];
            }

            if(catalogGroups.length) return catalogGroups;

            const userId = GetSessionDataManager().userId;

            if(!userId) return catalogGroups;

            try
            {
                const profileGroups = await awaitNitroResponse<UserProfileEvent, HabboGroupEntryData[]>({
                    request: () => new UserProfileComposer(userId, false),
                    parser: UserProfileEvent,
                    accept: event => (event.getParser().id === userId),
                    select: event => (event.getParser().groups || []),
                    timeoutMs: 5000
                });

                return profileGroups.length ? profileGroups : catalogGroups;
            }
            catch
            {
                return catalogGroups;
            }
        },
        enabled: options.enabled,
        staleTime: 0,
        refetchOnMount: 'always'
    });
