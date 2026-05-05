<template>
    <div class="whois-section my-4">
        <div class="row">
            <div class="col-12 mb-3">
                <div class="card jn-card" :class="{ 'dark-mode dark-mode-border': isDarkMode }">
                    <div class="card-body">
                        <!-- 输入框 -->
                        <div class="input-group mb-2 mt-2">
                            <input type="text" class="form-control" :class="{ 'dark-mode': isDarkMode }"
                                v-model="queryURLorIP" @keyup.enter="onSubmit">
                            <button class="btn btn-primary" @click="onSubmit" :disabled="whoisCheckStatus === 'running'">
                                <span v-if="whoisCheckStatus === 'running'" class="spinner-grow spinner-grow-sm"></span>
                                <span v-else>{{ t('whois.Run') }}</span>
                            </button>
                        </div>

                        <div class="jn-placeholder">
                            <p v-if="errorMsg" class="text-danger">{{ errorMsg }}</p>
                        </div>

                        <!-- 结果展示区 -->
                        <div v-if="whoisData && whoisData.data">
                            <div class="alert alert-success">{{ t('whois.Note3') }}</div>
                            
                            <!-- 摘要表格 -->
                            <div class="table-responsive mt-3">
                                <table class="table table-hover" :class="{ 'table-dark': isDarkMode }">
                                    <tbody>
                                        <tr v-for="(val, key) in parsedInfo" :key="key">
                                            <td class="fw-bold" style="width: 30%">{{ key }}</td>
                                            <td class="text-break">{{ val }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- 原始数据 -->
                            <div class="mt-3">
                                <div class="card card-body border-0 shadow-sm" :class="[isDarkMode ? 'bg-black text-light' : 'bg-light']">
                                    <pre class="small mb-0"><code>{{ JSON.stringify(whoisData.data, null, 2) }}</code></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMainStore } from '@/store';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const store = useMainStore();
const isDarkMode = computed(() => store.isDarkMode);

const queryURLorIP = ref('');
const whoisCheckStatus = ref('idle');
const errorMsg = ref('');
const whoisData = ref(null);

// 适配不同 RDAP 响应
const parsedInfo = computed(() => {
    if (!whoisData.value || !whoisData.value.data) return {};
    const d = whoisData.value.data;
    const res = {};

    // 域名/IP 基础字段
    if (whoisData.value.type === 'domain') {
        res['Domain'] = d.ldhName || 'N/A';
        res['Status'] = (d.status || []).join(', ');
    } else {
        res['IP Range'] = (d.startAddress && d.endAddress) ? `${d.startAddress} - ${d.endAddress}` : d.handle;
        res['Network Name'] = d.name || 'N/A';
        res['Country'] = d.country || 'N/A';
    }

    // 事件解析 (注册/过期/更新时间)
    if (d.events) {
        d.events.forEach(ev => {
            const date = new Date(ev.eventDate).toLocaleDateString();
            if (ev.eventAction === 'registration') res['Registered At'] = date;
            if (ev.eventAction === 'expiration') res['Expires At'] = date;
            if (ev.eventAction === 'last changed') res['Last Updated'] = date;
        });
    }

    // 实体解析 (注册商信息)
    if (d.entities) {
        const registrar = d.entities.find(e => e.roles && e.roles.includes('registrar'));
        if (registrar) {
            const fn = registrar.vcardArray?.[1]?.find(v => v[0] === 'fn');
            if (fn) res['Registrar'] = fn[3];
        }
    }

    return res;
});

const onSubmit = async () => {
    if (!queryURLorIP.value) return;
    errorMsg.value = '';
    whoisData.value = null;
    whoisCheckStatus.value = 'running';

    try {
        const resp = await fetch(`/api/whois?q=${encodeURIComponent(queryURLorIP.value.trim())}`);
        const result = await resp.json();
        
        if (!resp.ok) {
            errorMsg.value = result.message || result.error || t('whois.fetchError');
        } else {
            whoisData.value = result;
        }
    } catch (e) {
        errorMsg.value = t('whois.fetchError');
    } finally {
        whoisCheckStatus.value = 'idle';
    }
};
</script>